import nodemailer from 'nodemailer';

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

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function looksLikeHtml(s) {
  return /<[a-z][\s\S]*>/i.test(String(s || ''));
}

export async function POST(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const { assignments } = body;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No assignments provided.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  if (!hasGmail) {
    return new Response(
      JSON.stringify({
        error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars in Vercel project settings.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

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

  const status = results.failed.length > 0 ? 207 : 200;
  const message =
    results.failed.length > 0
      ? `Sent ${results.sent}, failed ${results.failed.length}`
      : `Emails sent to ${results.sent} team(s).`;
  const payload = { message, results };

  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
