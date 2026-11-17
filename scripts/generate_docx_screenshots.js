const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} = require('docx');

const IMG_DIR = path.join(__dirname, '..', 'report_images');
const OUT_FILE = path.join(__dirname, '..', 'VIT_Lost_Found_Screenshots.docx');

const figures = [
  {
    id: '4.2',
    file: 'fig_4_2_login.png',
    title: 'Fig 4.2: Student Sign-In & Authentication Interface',
    desc: 'The login screen enforces institutional access control, restricting access strictly to validated @vit.edu student accounts and directing authenticated students to their personalized dashboards while blocking unauthorized external users.'
  },
  {
    id: '4.3',
    file: 'fig_4_3_dashboard.png',
    title: 'Fig 4.3: Student Central Dashboard with Active Report Lifecycles',
    desc: 'The student dashboard provides an overview of reported lost items, found items, active match notifications, and finder Karma points, offering one-click access to log new reports and inspect active match candidates.'
  },
  {
    id: '4.4',
    file: 'fig_4_4_report.png',
    title: 'Fig 4.4: Lost and Found Reporting Interface with Secret Detail Input',
    desc: 'When reporting a found item, the finder specifies a private identifying mark (e.g., "Decathlon Quechua tag with small yellow wrist lanyard"). This field is stored securely and never exposed through public APIs or client interfaces.'
  },
  {
    id: '4.5',
    file: 'fig_4_5_match_detail.png',
    title: 'Fig 4.5: AI Match Inspection & Explainable 5-Factor Score Breakdown',
    desc: 'When a match is formed, the platform renders a transparent, explainable breakdown of the 92% match score across image neural match (45%), description semantics (25%), category correlation (15%), and campus location proximity (10%).'
  },
  {
    id: '4.6',
    file: 'fig_4_6_claim_verification.png',
    title: 'Fig 4.6: Ownership Claim Verification Interface (Step 1)',
    desc: 'The owner enters a description of the item\'s hidden identifying detail. The system evaluates the submission against the finder\'s stored secret using fuzzy token similarity, tracking attempt counts without revealing the stored answer.'
  },
  {
    id: '4.7',
    file: 'fig_4_7_locked_claim.png',
    title: 'Fig 4.7: Locked Claim Notification after 3 Failed Attempts',
    desc: 'If incorrect details are submitted three times, the claim locks automatically to prevent brute-force impersonation, and displays an amber notification that the report has been escalated to Campus Security for manual review.'
  },
  {
    id: '4.8',
    file: 'fig_4_8_admin_login.png',
    title: 'Fig 4.8: Dedicated Campus Security Admin Login Portal (/admin/login)',
    desc: 'Campus Security Administrators authenticate through a dedicated administrative portal isolated from the student sign-in flow. Student credentials attempting to enter this portal are strictly denied access.'
  },
  {
    id: '4.9',
    file: 'fig_4_9_admin_flagged_desk.png',
    title: 'Fig 4.9: Admin Flagged Claims Dispute Resolution Desk',
    desc: 'In the Flagged Claims Review tab, security administrators inspect the ground-truth secret detail alongside the student\'s submitted attempt logs and similarity scores, with one-click actions to "Verify & Approve Claim" or "Reset Attempts to Retry".'
  },
  {
    id: '4.10',
    file: 'fig_4_10_handover_code.png',
    title: 'Fig 4.10: Persistent 6-Digit Handover Code & Unlocked Contact Card',
    desc: 'Upon verification (or admin approval), the atomic 6-digit handover code (934914) is permanently unlocked on the owner\'s dashboard alongside the finder\'s contact details, remaining visible even after page reloads.'
  },
  {
    id: '4.11',
    file: 'fig_4_11_gmail_draft.png',
    title: 'Fig 4.11: Direct Gmail Webmail Pre-Composed Recovery Draft',
    desc: 'Clicking "Open in Gmail (Pre-written Details)" redirects the student directly to Google Mail Webmail Compose with a pre-filled draft containing recipient email, subject, handover code, and campus meeting points (SJT, Library, Security Desk).'
  },
  {
    id: '4.12',
    file: 'fig_4_12_handover_completion.png',
    title: 'Fig 4.12: Handover Completion, Karma Credit & Automated Photo Purge',
    desc: 'When the finder enters the 6-digit handover code, the item is marked as returned, 10 Karma Points are credited to the finder, and all associated photographs and vector embeddings are permanently wiped from server disk storage.'
  }
];

async function generateDocx() {
  const children = [];

  // Header / Document Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'VISHWAKARMA INSTITUTE OF TECHNOLOGY, PUNE',
          bold: true,
          size: 26,
          font: 'Calibri',
          color: '0F1B4C'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Department of Computer Science & Engineering (Artificial Intelligence)',
          size: 20,
          font: 'Calibri',
          color: '555555'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'Course Project Report — Section 4.3 Screenshots Walkthrough',
          bold: true,
          size: 24,
          font: 'Calibri',
          color: '2F5BEA'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Project: VIT Lost & Found — AI-Powered Campus Asset Recovery System',
          italics: true,
          size: 20,
          font: 'Calibri',
          color: '333333'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'Group-4: Aaryali Kadam (12414152) · Jay Jadhav (12412039) · Aayush Jha (12410120) · Ragini Kengale (12410883)\nGuide: Prof. Prachi A. Pawar | Academic Year 2026–27',
          size: 18,
          font: 'Calibri',
          color: '444444'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: '────────────────────────────────────────────────────────────────────────────────',
          color: 'CCCCCC'
        })
      ]
    })
  );

  // Append each figure with image and caption
  for (const fig of figures) {
    const imgPath = path.join(IMG_DIR, fig.file);
    if (!fs.existsSync(imgPath)) {
      console.warn(`File not found: ${imgPath}`);
      continue;
    }

    const imgBuffer = fs.readFileSync(imgPath);

    // Figure Title
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: fig.title,
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '0F1B4C'
          })
        ]
      })
    );

    // Image (Width: 580 px, Height: ~362 px - clean proportion)
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
        children: [
          new ImageRun({
            data: imgBuffer,
            transformation: {
              width: 580,
              height: 362
            }
          })
        ]
      })
    );

    // Figure Caption & Description Box
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFY,
        spacing: { after: 350 },
        children: [
          new TextRun({
            text: `${fig.title}: `,
            bold: true,
            size: 19,
            font: 'Calibri',
            color: '111111'
          }),
          new TextRun({
            text: fig.desc,
            size: 19,
            font: 'Calibri',
            color: '444444'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 250 },
        children: [
          new TextRun({
            text: '────────────────────────────────────────────────────────',
            color: 'E0E0E0'
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000
            }
          }
        },
        children: children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_FILE, buffer);
  console.log(`Document created successfully at: ${OUT_FILE}`);
}

generateDocx().catch(console.error);
