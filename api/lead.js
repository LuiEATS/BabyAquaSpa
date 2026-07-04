// /api/lead — Vercel serverless function
//
// Receives lead info from the Book, Contact, and chatbot forms and emails it
// via Resend. Requires a RESEND_API_KEY environment variable in Vercel
// (Settings → Environment Variables). Until a sending domain is verified in
// Resend, FROM_EMAIL below uses Resend's shared test domain, which only
// delivers to the email address on your Resend account — see
// README.md ("Connecting real lead capture") to switch to a verified domain.

const FROM_EMAIL = 'BabyAquaSpa Leads <onboarding@resend.dev>';
const TO_EMAIL = 'hello@babyaquaspa.com'; // placeholder — update to the real inbox that should receive leads

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const lead = req.body || {};

    // Still logged as a fallback — visible in Vercel's dashboard under your project > Logs.
    console.log('New BabyAquaSpa lead:', JSON.stringify(lead));

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: TO_EMAIL,
          subject: `New lead: ${lead.name || 'Unknown'}`,
          text: JSON.stringify(lead, null, 2),
        }),
      });

      if (!emailRes.ok) {
        console.error('Resend API error:', emailRes.status, await emailRes.text());
      }
    } else {
      console.warn('RESEND_API_KEY not set — lead was logged but not emailed.');
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead API error:', err);
    res.status(500).json({ error: 'Could not save lead.' });
  }
};
