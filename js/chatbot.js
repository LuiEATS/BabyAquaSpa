/*
  BabyAquaSpa chatbot widget.

  Talks to /api/chat (a serverless function you deploy — see README.md).
  That function calls the Claude API server-side so your API key is never
  exposed in the browser. Until it's deployed, the widget still works and
  will show a friendly "still getting set up" message.
*/

(function () {
  const STORAGE_KEY = 'basp_chat_history';

  const state = {
    history: [], // { role: 'user'|'assistant', content: string }
    open: false,
  };

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    children.forEach(c => node.appendChild(c));
    return node;
  }

  function buildWidget() {
    const launcher = el('button', { class: 'chat-launcher', 'aria-label': 'Open chat with BabyAquaSpa' , html: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      <span class="pulse-dot"></span>
    `});

    const panel = el('div', { class: 'chat-panel', role: 'dialog', 'aria-label': 'BabyAquaSpa chat' });

    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-title"><span class="dot"></span> BabyAquaSpa Assistant</div>
        <button class="chat-close" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="chat-body" id="basp-chat-body"></div>
      <div class="chat-input-row">
        <input type="text" id="basp-chat-input" placeholder="Ask about pricing, insurance, ages…" aria-label="Type a message" />
        <button class="chat-send" id="basp-chat-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    launcher.addEventListener('click', () => togglePanel(panel, true));
    panel.querySelector('.chat-close').addEventListener('click', () => togglePanel(panel, false));

    const input = panel.querySelector('#basp-chat-input');
    const sendBtn = panel.querySelector('#basp-chat-send');
    sendBtn.addEventListener('click', () => sendMessage(panel));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage(panel);
    });

    // Greeting + quick replies on first open
    renderMessage(panel, 'bot', "Hi! I'm here to help with questions about BabyAquaSpa — sessions, pricing, insurance billing, or booking. What would you like to know?");
    renderQuickReplies(panel, [
      "What's included in a session?",
      "Do you accept insurance?",
      "What ages do you treat?",
      "I'd like a call back",
    ]);
  }

  function togglePanel(panel, open) {
    panel.classList.toggle('open', open);
    if (open) {
      const input = panel.querySelector('#basp-chat-input');
      setTimeout(() => input && input.focus(), 200);
    }
  }

  function renderMessage(panel, role, text) {
    const body = panel.querySelector('#basp-chat-body');
    const msg = el('div', { class: `chat-msg ${role}` });
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  const QUICK_REPLY_PASTELS = ['pastel-pink', 'pastel-sky', 'pastel-mint', 'pastel-lavender'];

  function renderQuickReplies(panel, options) {
    const body = panel.querySelector('#basp-chat-body');
    const wrap = el('div', { class: 'chat-quick-replies' });
    options.forEach((opt, i) => {
      const btn = el('button', { class: `chat-quick-reply ${QUICK_REPLY_PASTELS[i % QUICK_REPLY_PASTELS.length]}` });
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        wrap.remove();
        if (opt === "I'd like a call back") {
          renderLeadForm(panel);
        } else {
          handleUserMessage(panel, opt);
        }
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function renderTyping(panel) {
    const body = panel.querySelector('#basp-chat-body');
    const typing = el('div', { class: 'chat-msg bot', id: 'basp-typing' });
    typing.innerHTML = '<div class="chat-typing"><span></span><span></span><span></span></div>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    return typing;
  }

  // Inline lead capture form rendered inside the chat body
  function renderLeadForm(panel) {
    const body = panel.querySelector('#basp-chat-body');
    const wrap = el('div', { class: 'chat-msg bot' });
    wrap.style.width = '100%';
    wrap.style.maxWidth = '100%';
    wrap.innerHTML = `
      <p style="margin:0 0 10px;font-weight:500;">Great — leave your info and our team will call you back within one business day.</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <input type="text" id="basp-lead-name" placeholder="Your name" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:0.86rem;" />
        <input type="tel" id="basp-lead-phone" placeholder="Phone number" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:0.86rem;" />
        <input type="email" id="basp-lead-email" placeholder="Email (optional)" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:0.86rem;" />
        <button id="basp-lead-submit" class="btn btn-primary btn-block" style="padding:10px;font-size:0.86rem;margin-top:4px;">Request a call back</button>
      </div>
    `;
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;

    wrap.querySelector('#basp-lead-submit').addEventListener('click', async () => {
      const name = wrap.querySelector('#basp-lead-name').value.trim();
      const phone = wrap.querySelector('#basp-lead-phone').value.trim();
      const email = wrap.querySelector('#basp-lead-email').value.trim();
      if (!name || !phone) {
        alert('Please add at least your name and phone number.');
        return;
      }
      try {
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, source: 'chatbot' })
        });
      } catch (e) {
        // fail silently in chat — still confirm to the user, but log for debugging
        console.warn('Lead submission failed', e);
      }
      wrap.remove();
      renderMessage(panel, 'bot', `Thanks, ${name.split(' ')[0]}! We've got your number (${phone}) and someone from our team will reach out soon.`);
    });
  }

  async function sendMessage(panel) {
    const input = panel.querySelector('#basp-chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleUserMessage(panel, text);
  }

  async function handleUserMessage(panel, text) {
    renderMessage(panel, 'user', text);
    state.history.push({ role: 'user', content: text });

    const typing = renderTyping(panel);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.history }),
      });

      if (!res.ok) throw new Error('Chat endpoint not available yet');
      const data = await res.json();
      typing.remove();
      const reply = data.reply || "Sorry, I didn't quite get that — could you rephrase?";
      renderMessage(panel, 'bot', reply);
      state.history.push({ role: 'assistant', content: reply });
    } catch (err) {
      typing.remove();
      renderMessage(
        panel,
        'bot',
        "I'm still getting fully set up behind the scenes! For now, call us at (504) 555-0182 or leave your info and we'll call you back."
      );
      renderQuickReplies(panel, ["I'd like a call back"]);
    }
  }

  document.addEventListener('DOMContentLoaded', buildWidget);
})();
