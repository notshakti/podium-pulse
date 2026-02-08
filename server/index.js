import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from project root so GMAIL_* are found regardless of process cwd
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
const transporter = hasGmail
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : { sendMail: async () => { throw new Error('Gmail not configured'); } };

app.post('/api/send-problem-statements', async (req, res) => {
  const { assignments } = req.body;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ error: 'No assignments provided.' });
  }

  if (!hasGmail) {
    return res.status(503).json({
      error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars and restart the server.',
    });
  }

  const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const looksLikeHtml = (s) => /<[a-z][\s\S]*>/i.test(String(s || ''));

  const results = { sent: 0, failed: [] };
  for (const a of assignments) {
    try {
      const contentForText = stripHtml(a.problemContent) || a.problemContent;
      const contentForHtml = looksLikeHtml(a.problemContent)
        ? a.problemContent
        : `<pre style="white-space: pre-wrap; font-family: inherit;">${String(a.problemContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: a.email,
        subject: `Build a Bot — Your problem statement: ${a.problemTitle}`,
        text: `Hi ${a.teamName},\n\nYour assigned problem statement:\n\n${a.problemTitle}\n\n${contentForText}\n\n— Build a Bot Hackathon`,
        html: `
          <p>Hi <strong>${a.teamName}</strong>,</p>
          <h2>${a.problemTitle}</h2>
          <div class="problem-content">${contentForHtml}</div>
          <p>— Build a Bot Hackathon</p>
        `,
      });
      results.sent++;
    } catch (err) {
      results.failed.push({ email: a.email, error: err.message });
    }
  }

  if (results.failed.length > 0) {
    return res.status(207).json({ message: `Sent ${results.sent}, failed ${results.failed.length}`, results });
  }
  res.json({ message: `Emails sent to ${results.sent} team(s).`, results });
});

app.listen(PORT, () => {
  console.log(`Build a Bot email server running on http://localhost:${PORT}`);
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('GMAIL_USER and GMAIL_APP_PASSWORD not set. Email sending will return 503 until configured.');
  }
});
