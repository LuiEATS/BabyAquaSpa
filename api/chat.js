// /api/chat — Vercel serverless function
//
// Receives the chat history from the widget, calls the Claude API with your
// secret key (kept server-side via an environment variable), and returns the
// assistant's reply. See README.md for deployment steps.

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `
You are the front-desk assistant for BabyAquaSpa, a luxury infant hydrotherapy
clinic in New Orleans, Louisiana. You help visitors understand services,
pricing, and how insurance billing works, and you gently guide interested
visitors toward booking a session or leaving contact info for a callback.

Facts you can rely on:
- Services: infant hydrotherapy (warm-water floating sessions), infant massage,
  Swiss ball / tummy-time activities, developmental play. Sessions are 25–55
  minutes of baby activity time depending on package.
- Ages served: 2 months to 2.5 years old.
- Staffing: all sessions led by licensed nurses, midwives, or pediatric
  physical/occupational therapists.
- Hybrid billing model: standard sessions are private-pay (like a spa visit).
  For babies with a documented medical need (e.g. torticollis, low muscle
  tone, feeding/digestive issues, developmental delay), a licensed PT/OT can
  bill the session to insurance or Medicaid using CPT codes such as 97113
  (aquatic therapy), 97140 (manual therapy/infant massage), and 97530
  (therapeutic activities), when medical necessity is documented. Coverage
  depends on the family's specific plan — we verify benefits before billing.
- Location: New Orleans, LA (exact address to be confirmed by staff).
- To book, or to check insurance eligibility, the best next step is either
  the Book Now page or leaving contact info for a callback.

Tone: warm, reassuring, concise (2–4 sentences per reply). Never give medical
diagnoses or promise specific insurance coverage — always say coverage is
confirmed during a benefits check. If someone seems ready to book or wants a
human, encourage them to share their name and phone number or visit the Book
Now page.
`.trim();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-12), // keep the payload small; last 12 turns is plenty of context
    });

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Something went wrong talking to the assistant.' });
  }
};
