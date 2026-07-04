# BabyAquaSpa Website

A 5-page marketing site for BabyAquaSpa (New Orleans infant hydrotherapy
clinic) with an AI chatbot for answering questions and capturing leads.

## What's in here

```
index.html        Home page
services.html      Packages & pricing
insurance.html    Insurance/medical billing explainer
book.html          Booking form (lead capture)
contact.html       Contact form (lead capture)
css/styles.css     All styles
js/main.js         Nav, scroll animation, form submission
js/chatbot.js      Chat widget UI + logic
api/chat.js        Serverless function — talks to Claude (needs deployment)
api/lead.js        Serverless function — receives form/chat leads (needs deployment)
package.json       Dependency needed by api/chat.js
```

## 1. Preview it right now (no setup)

Every page works as a static site already. Easiest way to look at it locally:

```bash
cd babyaquaspa
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser. Click around all 5 pages,
test the mobile menu (resize your browser), and open the chat bubble —
it'll work and reply with a friendly fallback message, since /api/chat isn't
live yet at this stage.

## 2. Add your logo

Right now the logo is a placeholder circle with a small water-drop icon.
To swap in your real logo:

1. Save your logo file (SVG or PNG, ideally square/round) into `assets/logo.svg` (or `.png`)
2. In **every** HTML file, find this block (appears in the header, twice per page — once for header, once for footer):
   ```html
   <span class="logo-mark">
     <svg viewBox="0 0 24 24" ...>...</svg>
   </span>
   ```
3. Replace the `<svg>...</svg>` inside with:
   ```html
   <img src="assets/logo.svg" alt="BabyAquaSpa" style="width:100%;height:100%;object-fit:contain;border-radius:50%;">
   ```

That's it — every page uses the same markup, so once you've done the swap
on one page you can copy/paste that same change into the rest.

## 3. Deploy the site (so the chatbot and forms actually work)

The chatbot and lead forms need a real backend to run (so your Anthropic API
key stays private, and so leads actually go somewhere). The easiest free way
to do this is **Vercel**, since this project is already structured for it.

1. Create a free account at https://vercel.com
2. Install their CLI: `npm install -g vercel`
3. From inside the `babyaquaspa` folder, run: `vercel`
   - Follow the prompts (accept defaults is fine for a first deploy)
4. In the Vercel dashboard, go to your project → **Settings → Environment Variables**
   and add:
   - `ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
5. Redeploy (`vercel --prod`) so the environment variable takes effect.

Once deployed, `/api/chat` and `/api/lead` will be live automatically —
no code changes needed. The chatbot will start giving real AI answers about
your services, pricing, and insurance billing (it's already been given all
of that context — see the `SYSTEM_PROMPT` in `api/chat.js` if you want to
edit what it knows or how it talks).

**Don't have an Anthropic API key yet?** Get one at
https://console.anthropic.com — you'll need a payment method on file, but
costs for a chatbot at small-business scale are typically a few dollars a
month.

## 4. Connecting real lead capture

Right now, `api/lead.js` just logs submitted leads to Vercel's function logs
— visible in your Vercel dashboard, but not a real inbox. Pick one option to
actually receive leads:

**Option A — Email via Resend (simplest)**
1. Create a free account at https://resend.com and verify a sending domain (or use their test domain to start)
2. Get an API key, add it to Vercel as `RESEND_API_KEY`
3. In `api/lead.js`, uncomment the "OPTION: forward by email via Resend" block and update the `to` address

**Option B — Google Sheet**
Use a service like Sheet.best or a Google Apps Script Web App as the target
URL, and change the `fetch` destination in `js/main.js` and `js/chatbot.js`
from `/api/lead` to that URL directly. Simpler to set up without touching
serverless functions, but leads live in a spreadsheet instead of your inbox.

**Option C — CRM/booking tool**
If you already use something like Calendly, Acuity, or a CRM with a public
form API, swap the form's `fetch('/api/lead', ...)` call for that service's
API endpoint instead.

Whichever you choose, test it by submitting the Contact form and confirming
the lead actually arrives.

## 5. Before you launch — placeholder content checklist

Search each file for bracketed text and real info:
- [ ] Street address (home, contact, insurance pages)
- [ ] Real phone number and email (currently `(504) 555-0182` / `hello@babyaquaspa.com`)
- [ ] Hero and gallery photography (currently text placeholders in gray boxes)
- [ ] Map embed (contact.html and index.html — replace placeholder div with a Google Maps iframe)
- [ ] Real client testimonial (index.html)
- [ ] Confirm pricing against what you'll actually charge
- [ ] Have your biller/compliance advisor review the CPT/ICD-10 codes and
      reimbursement ranges on insurance.html — these are industry-typical
      figures, not guaranteed rates, and medical billing claims should be
      reviewed before publishing

## 6. Editing pages

There's no build step — these are plain HTML files. Open any `.html` file
in a text editor, find the text you want to change, and save. All 5 pages
share the same header/footer markup, so if you change nav links or footer
info, make the same edit on all 5 files (there's no shared-include system
here to keep things simple to host anywhere).
