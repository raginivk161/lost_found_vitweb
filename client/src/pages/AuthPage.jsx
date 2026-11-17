import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Hash,
  ArrowRight,
  ShieldAlert,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [step, setStep] = useState('form'); // 'form' | 'otp'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');

  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes
  const [cooldown, setCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const { login, signup, verifyOtp, resendOtp, user } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // OTP Timer countdown
  useEffect(() => {
    let timer;
    if (step === 'otp' && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, remainingTime]);

  // Resend cooldown countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Email domain validation helper
  function validateEmailDomain(emailStr) {
    return emailStr.toLowerCase().trim().endsWith('@vit.edu');
  }

  // Handle Login submission
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!validateEmailDomain(email)) {
      setError('Only valid VIT email addresses (@vit.edu) are accepted.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Sign-up submission -> triggers OTP screen
  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!validateEmailDomain(email)) {
      setError('Only valid VIT email addresses (@vit.edu) are accepted.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name,
        email: email.trim().toLowerCase(),
        registration_number: regNumber.trim().toUpperCase(),
        password,
      });
      setStep('otp');
      setRemainingTime(300);
      setCooldown(30);
      setNotice('Verification code sent! Enter the 6-digit OTP below.');
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP input digits
  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  }

  // Handle OTP verify
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOtp(email.trim().toLowerCase(), fullOtp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Resend OTP
  async function handleResend() {
    if (cooldown > 0) return;
    setError('');
    try {
      await resendOtp(email.trim().toLowerCase());
      setCooldown(30);
      setRemainingTime(300);
      setOtpDigits(['', '', '', '', '', '']);
      setNotice('A fresh 6-digit verification code has been dispatched.');
    } catch (err) {
      setError(err.message);
    }
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy to-primary flex items-center justify-center text-white mx-auto shadow-md">
          <Sparkles className="w-6 h-6 text-amber-300" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-navy tracking-tight">
          VIT Lost &amp; Found
        </h2>
        <p className="text-xs text-muted mt-1 font-medium">
          Exclusive portal for VIT students &amp; faculty
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 shadow-soft">
          {/* Dev Mode Banner */}
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Demo Notice:</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                For demo testing, you can sign in with seeded account <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">aarav.sharma2024@vit.edu</code> (pwd: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Student@123</code>) or create a new student account.
              </p>
            </div>
          </div>

          {step === 'form' ? (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setNotice(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                    activeTab === 'login'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-navy'
                  }`}
                >
                  Student Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setError(''); setNotice(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition ${
                    activeTab === 'signup'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-navy'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {/* Error / Notice Banners */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {notice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              {/* Login Form */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">VIT Email Address</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name.registration2024@vit.edu"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Signing in...' : 'Sign In to Campus Portal'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">VIT Email Address</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.name2024@vit.edu"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1">Must end with @vit.edu</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Registration Number</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder="e.g. 24BCE1001"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating account...' : 'Create Account & Verify OTP'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* OTP Verification Screen */
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-navy text-lg">Verify Your VIT Email</h3>
                <p className="text-xs text-muted mt-1">
                  We sent a 6-digit code to <strong className="text-slate-800">{email}</strong>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {notice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6 Digit Box Input */}
                <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e.key)}
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-slate-50 focus:bg-white"
                    />
                  ))}
                </div>

                {/* Expiry and attempts remaining */}
                <div className="flex items-center justify-between text-xs text-muted px-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expires in: <strong className="text-slate-700">{formatTimer(remainingTime)}</strong></span>
                  </div>
                  <span>{remainingAttempts} attempts left</span>
                </div>

                {/* Submit verification */}
                <button
                  type="submit"
                  disabled={loading || remainingTime === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Enter Campus'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Resend button */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="text-xs font-semibold text-primary hover:text-primary-hover disabled:text-muted flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cooldown > 0 ? '' : 'animate-spin-slow'}`} />
                    <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP Code'}</span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); }}
                    className="text-xs text-muted hover:text-navy underline"
                  >
                    Change registration email
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
