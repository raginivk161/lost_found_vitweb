const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Rate limiters
const signupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many signup attempts. Try again later.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts. Try again later.' } });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many OTP attempts. Try again later.' } });
const resendLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 3, message: { error: 'Too many resend requests. Wait before trying again.' } });

// Email domain validation
function isAllowedEmail(email) {
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'vit.edu').split(',').map(d => d.trim());
  return domains.some(domain => email.toLowerCase().endsWith('@' + domain));
}

// Lazy transporter
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.DEV_MODE === 'true') {
      console.log(`\n📧 DEV MODE - OTP for ${email}: ${otp}\n`);
      return true;
    }
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  }
  await transport.sendMail({
    from: `"VIT Lost & Found" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'VIT Lost & Found - Verify Your Email',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #F7F8FC; border-radius: 16px;">
        <h2 style="color: #0F1B4C; text-align: center;">VIT Lost & Found</h2>
        <p style="color: #1E293B; text-align: center;">Your verification code is:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2F5BEA; padding: 16px; background: white; border-radius: 12px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #64748B; text-align: center; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
  return true;
}

// Set auth cookie
function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return token;
}

// POST /signup
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { name, email, registration_number, password } = req.body;

    if (!name || !email || !registration_number || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!isAllowedEmail(email)) {
      const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'vit.edu').split(',').map(d => d.trim());
      return res.status(400).json({ error: `Only ${domains.map(d => '@' + d).join(', ')} email addresses are allowed.` });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const db = getDb();
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const existingReg = db.prepare('SELECT id FROM users WHERE registration_number = ?').get(registration_number);
    if (existingReg) {
      return res.status(409).json({ error: 'An account with this registration number already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare(
      'INSERT INTO users (name, email, registration_number, password_hash) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email.toLowerCase().trim(), registration_number.trim(), passwordHash);

    // Generate and store OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO otps (email, otp_hash, expires_at) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), otpHash, expiresAt);

    await sendOTPEmail(email.toLowerCase().trim(), otp);

    res.status(201).json({ message: 'Account created. Check your email for the verification code.', email: email.toLowerCase() });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Failed to create account.' });
  }
});

// POST /verify-otp
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const db = getDb();
    const otpRecord = db.prepare(
      "SELECT * FROM otps WHERE email = ? AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
    ).get(email.toLowerCase());

    if (!otpRecord) {
      return res.status(400).json({ error: 'No valid OTP found. Request a new one.' });
    }
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
    }

    // Increment attempts
    db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').run(otpRecord.id);

    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) {
      const remaining = 4 - otpRecord.attempts;
      return res.status(400).json({ error: 'Invalid OTP.', remainingAttempts: Math.max(0, remaining) });
    }

    // Mark as used
    db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(otpRecord.id);

    // Get user and set cookie
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    setAuthCookie(res, user);
    res.json({
      message: 'Email verified successfully.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// POST /resend-otp
router.post('/resend-otp', resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const db = getDb();

    // Check cooldown
    const lastOtp = db.prepare(
      "SELECT created_at FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1"
    ).get(email.toLowerCase());
    if (lastOtp) {
      const elapsed = Date.now() - new Date(lastOtp.created_at + 'Z').getTime();
      if (elapsed < 30000) {
        const wait = Math.ceil((30000 - elapsed) / 1000);
        return res.status(429).json({ error: `Please wait ${wait} seconds before requesting a new code.`, cooldown: wait });
      }
    }

    // Check user exists
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO otps (email, otp_hash, expires_at) VALUES (?, ?, ?)').run(
      email.toLowerCase(), otpHash, expiresAt
    );

    await sendOTPEmail(email.toLowerCase(), otp);
    res.json({ message: 'New verification code sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: err.message || 'Failed to resend code.' });
  }
});

// POST /login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (!isAllowedEmail(email)) {
      const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'vit.edu').split(',').map(d => d.trim());
      return res.status(400).json({ error: `Only ${domains.map(d => '@' + d).join(', ')} email addresses are allowed.` });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    setAuthCookie(res, user);
    res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, karma_points: user.karma_points },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /admin-login - Dedicated login for Campus Security & Database Admin
router.post('/admin-login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. This portal is strictly for Campus Security Administrators. Students please sign in via Student Login.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    setAuthCookie(res, user);
    res.json({
      message: 'Admin authentication successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, karma_points: user.karma_points },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed.' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out.' });
});

// GET /me
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, registration_number, role, karma_points, phone, notification_preferences, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

module.exports = router;
