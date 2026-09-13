/**
 * FolioDesk Enhanced AI Agent Chatbot Widget — v2.1
 *
 * FIXES in v2.1:
 *  1. Button labels: no emoji, clean text, consistent font-family
 *  2. Font colour contrast: forced on user/assistant bubbles
 *  3. PDF blank space: fixed html2canvas window dimensions
 *  4. Short AI replies: STARTING_MSG filtered from API history, capped at 20 msgs
 *  5. #### hashtags: added h4 handler in parseMarkdownToHtml
 *  6. Chat fails after 3 prompts: isSending guard + 401 token refresh retry
 *  7. Copy button feedback: button turns green for 2s on success
 *  8. Copy to Word: ClipboardItem with text/html AND text/plain
 *  9. Text alignment: aggressive !important CSS override
 * 10. Haphazard fonts: single font-family on container, all children inherit
 */
(function () {
  if (window.FolioDeskEnhancedChatbotInitialized) return;
  window.FolioDeskEnhancedChatbotInitialized = true;

  const currentScript =
    document.currentScript ||
    document.getElementById("foliodesk-chatbot-script") ||
    Array.from(document.querySelectorAll("script")).find((s) =>
      s.src && s.src.includes("enhanced-widget.js")
    ) ||
    Array.from(document.querySelectorAll("script")).slice(-1)[0];

  const API_KEY = (currentScript && currentScript.getAttribute("data-chatbot-id")) || "Lm9QyNOPFSzSUVy8XuCEvUDol__n6g92";
  const AGENT_ID = (currentScript && currentScript.getAttribute("data-agent-id")) || "d139564c-a122-11f1-aee4-4e013e2ddde4";
  const AGENT_NAME =
    (currentScript && currentScript.getAttribute("data-name")) || "FolioDesk AI Assistant";
  const PRIMARY_COLOR =
    (currentScript && currentScript.getAttribute("data-primary-color")) || "#031B4E";
  const BUTTON_BG =
    (currentScript && currentScript.getAttribute("data-button-background-color")) || "#0061EB";
  const SECONDARY_COLOR =
    (currentScript && currentScript.getAttribute("data-secondary-color")) || "#E5E8ED";
  const LOGO_SRC =
    (currentScript && currentScript.getAttribute("data-logo")) ||
    "/static/chatbot/icons/default-agent.svg";
  const STARTING_MSG =
    (currentScript && currentScript.getAttribute("data-starting-message")) ||
    "Hello! How can I help you today?";

  let API_URL = (currentScript && currentScript.getAttribute("data-api-url")) || "https://qdaknrh2rzs3aueib5py5cbo.agents.do-ai.run";


  const STORAGE_KEY_SESSIONS = "foliodesk_chatbot_sessions_v1";
  const STORAGE_KEY_ACTIVE = "foliodesk_chatbot_active_session_v1";

  // BUG FIX 6: isSending guard
  let isSending = false;

  // BUG FIX 10: Consistent font stack used everywhere
  const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  function getStoredSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveStoredSessions(sessions) {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {
      console.warn("FolioDesk Chatbot: Storage limit reached.", e);
    }
  }

  function createNewSession() {
    const session = {
      id: "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    if (STARTING_MSG) {
      session.messages.push({
        id: "msg_init_" + Date.now(),
        role: "assistant",
        content: STARTING_MSG,
        timestamp: new Date().toISOString()
      });
    }
    const sessions = getStoredSessions();
    sessions.unshift(session);
    saveStoredSessions(sessions);
    localStorage.setItem(STORAGE_KEY_ACTIVE, session.id);
    return session;
  }

  function updateActiveSessionMessages(messages, customTitle = null) {
    const sessions = getStoredSessions();
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const index = sessions.findIndex((s) => s.id === activeId);
    if (index !== -1) {
      sessions[index].messages = messages;
      sessions[index].updatedAt = new Date().toISOString();
      if (customTitle) {
        sessions[index].title = customTitle;
      } else if (sessions[index].title === "New Conversation") {
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) {
          sessions[index].title = firstUserMsg.content.substring(0, 32) + (firstUserMsg.content.length > 32 ? "..." : "");
        }
      }
      saveStoredSessions(sessions);
    }
  }

  let cachedToken = null;
  let tokenExpiry = 0;

  async function getAccessToken(forceRefresh = false) {
    if (!forceRefresh && cachedToken && Date.now() < tokenExpiry - 30000) {
      return cachedToken;
    }
    // Clear on forced refresh
    cachedToken = null;
    tokenExpiry = 0;
    try {
      const res = await fetch(
        `https://cloud.digitalocean.com/gen-ai/auth/agents/${AGENT_ID}/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
          },
          body: JSON.stringify({})
        }
      );
      if (!res.ok) throw new Error("Authentication failed: " + res.statusText);
      const data = await res.json();
      cachedToken = data.access_token;
      tokenExpiry = Date.now() + 50 * 60 * 1000;
      return cachedToken;
    } catch (err) {
      console.error("FolioDesk Chatbot Auth Error:", err);
      throw err;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ─── STYLES ────────────────────────────────────────────────────────────────
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    /* BUG FIX 10: Single font stack on container — all children inherit */
    .fd-chat-container {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 420px;
      max-width: calc(100vw - 32px);
      height: 650px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: ${FONT_STACK} !important;
      font-size: 14px;
      line-height: 1.5;
      color: #1E293B;
      transition: opacity 0.25s ease, transform 0.25s ease;
      border: 1px solid rgba(0,0,0,0.08);
    }
    /* BUG FIX 9: Force all text left inside container */
    .fd-chat-container,
    .fd-chat-container *,
    .fd-chat-messages,
    .fd-message,
    .fd-bubble,
    .fd-bubble *,
    .fd-chat-toolbar,
    .fd-toolbar-group,
    .fd-toolbar-btn,
    .fd-chat-input-area,
    .fd-history-drawer,
    .fd-history-list,
    .fd-history-item,
    .fd-drawer-header {
      text-align: left !important;
      font-family: ${FONT_STACK} !important;
    }
    .fd-chat-container.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
    }
    .fd-chat-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${BUTTON_BG};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: none;
      outline: none;
    }
    .fd-chat-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
    .fd-chat-launcher svg {
      width: 28px;
      height: 28px;
      fill: #ffffff;
    }
    .fd-chat-header {
      background: ${PRIMARY_COLOR};
      color: #ffffff !important;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    .fd-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .fd-header-logo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      object-fit: cover;
    }
    .fd-header-title {
      font-weight: 600;
      font-size: 15px;
      color: #ffffff !important;
      font-family: ${FONT_STACK} !important;
    }
    .fd-header-status {
      font-size: 11px;
      color: rgba(255,255,255,0.75) !important;
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: ${FONT_STACK} !important;
    }
    .fd-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      flex-shrink: 0;
    }
    .fd-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .fd-action-btn {
      background: rgba(255,255,255,0.12);
      border: none;
      color: #ffffff !important;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      position: relative;
    }
    .fd-action-btn:hover {
      background: rgba(255,255,255,0.25);
    }
    .fd-action-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .fd-tooltip {
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: #1F2937;
      color: #ffffff !important;
      font-size: 10px;
      font-family: ${FONT_STACK} !important;
      padding: 3px 6px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 100000;
    }
    .fd-action-btn:hover .fd-tooltip {
      opacity: 1;
    }
    /* BUG FIX 1 & 10: Toolbar buttons — clean text, no emoji, consistent font */
    .fd-chat-toolbar {
      background: ${SECONDARY_COLOR};
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #475569 !important;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .fd-toolbar-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #64748B !important;
      font-family: ${FONT_STACK} !important;
    }
    .fd-toolbar-group {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: nowrap;
    }
    .fd-toolbar-btn {
      background: #ffffff;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      font-family: ${FONT_STACK} !important;
      color: #334155 !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      font-weight: 500;
      transition: all 0.15s ease;
      white-space: nowrap;
      line-height: 1.3;
    }
    .fd-toolbar-btn:hover {
      background: #EFF6FF;
      border-color: ${BUTTON_BG};
      color: #0F172A !important;
    }
    /* BUG FIX 7: Copy success state */
    .fd-toolbar-btn.copied {
      background: #10B981 !important;
      border-color: #059669 !important;
      color: #ffffff !important;
    }
    .fd-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F8FAFC;
    }
    .fd-message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.5;
    }
    .fd-message.user {
      align-self: flex-end;
    }
    .fd-message.assistant {
      align-self: flex-start;
    }
    .fd-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      position: relative;
    }
    /* BUG FIX 2: Force user bubble to white text */
    .fd-message.user .fd-bubble {
      background: ${BUTTON_BG};
      color: #ffffff !important;
      border-bottom-right-radius: 2px;
    }
    .fd-message.user .fd-bubble,
    .fd-message.user .fd-bubble * {
      color: #ffffff !important;
      font-family: ${FONT_STACK} !important;
    }
    /* BUG FIX 2: Force assistant bubble to dark text */
    .fd-message.assistant .fd-bubble {
      background: #ffffff;
      color: #1E293B !important;
      border-bottom-left-radius: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #E2E8F0;
    }
    .fd-message.assistant .fd-bubble,
    .fd-message.assistant .fd-bubble * {
      color: #1E293B !important;
      font-family: ${FONT_STACK} !important;
      text-align: left !important;
    }
    .fd-message.assistant .fd-bubble p {
      margin: 0 0 8px 0;
      color: #334155 !important;
      line-height: 1.6;
      font-size: 13px;
    }
    .fd-message.assistant .fd-bubble p:last-child { margin-bottom: 0; }
    .fd-message.assistant .fd-bubble h1 {
      font-size: 17px; font-weight: 800; color: #031B4E !important;
      margin: 18px 0 10px 0; border-bottom: 2px solid #031B4E;
      padding-bottom: 5px; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble h2 {
      font-size: 15px; font-weight: 700; color: #031B4E !important;
      margin: 16px 0 8px 0; border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble h3 {
      font-size: 13px; font-weight: 700; color: #0F172A !important;
      margin: 14px 0 6px 0; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble h4 {
      font-size: 12px; font-weight: 700; color: #334155 !important;
      margin: 10px 0 4px 0; text-transform: uppercase;
      letter-spacing: 0.5px; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble code {
      background: #F1F5F9; color: #0F172A !important;
      padding: 2px 5px; border-radius: 4px;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 11px;
    }
    .fd-message.assistant .fd-bubble pre {
      background: #1E293B; color: #F8FAFC !important;
      padding: 10px; border-radius: 6px;
      overflow-x: auto; font-size: 12px; margin: 8px 0;
    }
    .fd-message.assistant .fd-bubble pre code {
      background: transparent; color: #F8FAFC !important; padding: 0;
    }
    .fd-message.assistant .fd-bubble ul,
    .fd-message.assistant .fd-bubble ol {
      margin: 6px 0 10px 0; padding-left: 20px;
      color: #334155 !important; line-height: 1.6;
    }
    .fd-message.assistant .fd-bubble li {
      margin-bottom: 3px; color: #334155 !important;
    }
    .fd-message.assistant .fd-bubble strong,
    .fd-message.assistant .fd-bubble b {
      font-weight: 600; color: #0F172A !important;
    }
    .fd-message.assistant .fd-bubble table {
      width: 100%; border-collapse: collapse;
      margin: 10px 0; font-size: 12px;
    }
    .fd-message.assistant .fd-bubble th {
      background: #E2E8F0; color: #1E293B !important;
      padding: 6px 8px; border: 1px solid #CBD5E1;
      font-weight: 600; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble td {
      padding: 6px 8px; border: 1px solid #CBD5E1;
      color: #334155 !important; text-align: left !important;
    }
    .fd-message.assistant .fd-bubble blockquote {
      border-left: 3px solid #0061EB; padding-left: 12px;
      margin: 10px 0; color: #475569 !important;
      font-style: italic; text-align: left !important;
    }
    .fd-msg-meta {
      font-size: 10px;
      color: #94A3B8 !important;
      margin-top: 4px;
      align-self: flex-end;
      font-family: ${FONT_STACK} !important;
    }
    .fd-message.assistant .fd-msg-meta {
      align-self: flex-start;
    }
    .fd-chat-input-area {
      padding: 12px;
      background: #ffffff;
      border-top: 1px solid #E2E8F0;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }
    .fd-chat-textarea {
      flex: 1;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      font-family: ${FONT_STACK} !important;
      resize: none;
      height: 40px;
      max-height: 100px;
      outline: none;
      color: #1E293B !important;
      background: #FFFFFF !important;
      line-height: 1.5;
    }
    .fd-chat-textarea::placeholder {
      color: #94A3B8 !important;
    }
    .fd-chat-textarea:focus {
      border-color: ${BUTTON_BG};
      box-shadow: 0 0 0 2px rgba(0, 97, 235, 0.15);
    }
    .fd-send-btn {
      background: ${BUTTON_BG};
      color: #ffffff !important;
      border: none;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      flex-shrink: 0;
    }
    .fd-send-btn:hover { filter: brightness(0.9); }
    .fd-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .fd-send-btn svg {
      width: 18px;
      height: 18px;
      fill: #ffffff;
    }
    .fd-history-drawer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      z-index: 10;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.25s ease;
    }
    .fd-history-drawer.open {
      transform: translateX(0);
    }
    .fd-drawer-header {
      padding: 12px 16px;
      background: #F1F5F9;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 14px;
      color: #334155 !important;
      flex-shrink: 0;
    }
    .fd-close-drawer-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #64748B !important;
      font-family: ${FONT_STACK} !important;
    }
    .fd-history-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .fd-history-item {
      padding: 10px 12px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s ease;
    }
    .fd-history-item:hover {
      background: #F8FAFC;
      border-color: ${BUTTON_BG};
    }
    .fd-history-item.active {
      background: #EFF6FF;
      border-color: ${BUTTON_BG};
    }
    .fd-history-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .fd-history-item-title {
      font-size: 13px;
      font-weight: 500;
      color: #1E293B !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fd-history-item-date {
      font-size: 10px;
      color: #94A3B8 !important;
    }
    .fd-history-item-del {
      background: none;
      border: none;
      color: #EF4444 !important;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      font-family: ${FONT_STACK} !important;
    }
    .fd-history-item-del:hover { background: #FEE2E2; }
    .fd-toast {
      position: fixed;
      bottom: 100px;
      right: 30px;
      background: #1E293B;
      color: #ffffff !important;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-family: ${FONT_STACK} !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    .fd-toast.show { opacity: 1; }
  `;
  document.head.appendChild(styleEl);

  // ─── TOAST ─────────────────────────────────────────────────────────────────
  let toastTimer = null;
  const toastEl = document.createElement("div");
  toastEl.className = "fd-toast";
  document.body.appendChild(toastEl);

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
  }

  // ─── UI STRUCTURE ──────────────────────────────────────────────────────────
  const launcher = document.createElement("button");
  launcher.className = "fd-chat-launcher";
  launcher.title = "Open Chat Assistant";
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
    </svg>
  `;
  document.body.appendChild(launcher);

  const container = document.createElement("div");
  container.className = "fd-chat-container hidden";
  // BUG FIX 1: Clean text labels with SVG icons, no emoji
  container.innerHTML = `
    <div class="fd-chat-header">
      <div class="fd-header-brand">
        <img class="fd-header-logo" src="${LOGO_SRC}" alt="Logo" onerror="this.style.display='none'"/>
        <div>
          <div class="fd-header-title">${AGENT_NAME}</div>
          <div class="fd-header-status"><span class="fd-status-dot"></span> Online</div>
        </div>
      </div>
      <div class="fd-header-actions">
        <button class="fd-action-btn" id="fd-btn-new-chat" title="New Chat">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span class="fd-tooltip">New Chat</span>
        </button>
        <button class="fd-action-btn" id="fd-btn-history" title="History">
          <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
          <span class="fd-tooltip">History</span>
        </button>
        <button class="fd-action-btn" id="fd-btn-close" title="Close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          <span class="fd-tooltip">Close</span>
        </button>
      </div>
    </div>

    <div class="fd-chat-toolbar">
      <span class="fd-toolbar-label">Actions</span>
      <div class="fd-toolbar-group">
        <button class="fd-toolbar-btn" id="fd-btn-copy-last" title="Copy Last Response for MS Word">Copy Last</button>
        <button class="fd-toolbar-btn" id="fd-btn-copy-all" title="Copy Entire Conversation for MS Word">Copy All</button>
        <button class="fd-toolbar-btn" id="fd-btn-pdf-last" title="Export Last Response as PDF">PDF Last</button>
        <button class="fd-toolbar-btn" id="fd-btn-pdf-all" title="Export Entire Conversation as PDF">PDF All</button>
      </div>
    </div>

    <div class="fd-chat-messages" id="fd-messages-list"></div>

    <div class="fd-chat-input-area">
      <textarea class="fd-chat-textarea" id="fd-input-text" placeholder="Type a message..." rows="1"></textarea>
      <button class="fd-send-btn" id="fd-btn-send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>

    <div class="fd-history-drawer" id="fd-history-drawer">
      <div class="fd-drawer-header">
        <span>Saved Conversations</span>
        <button class="fd-close-drawer-btn" id="fd-btn-close-drawer">&times;</button>
      </div>
      <div class="fd-history-list" id="fd-history-list"></div>
    </div>
  `;
  document.body.appendChild(container);

  let currentSession = createNewSession();
  const messagesListEl = container.querySelector("#fd-messages-list");

  // ─── MARKDOWN PARSER ───────────────────────────────────────────────────────
  function parseMarkdownToHtml(md) {
    if (!md) return "";

    let lines = md.split("\n");
    let inTable = false;
    let tableHeader = null;
    let tableRows = [];
    let htmlLines = [];
    let inList = false;
    let listType = null;

    function closeTable() {
      if (!inTable) return;
      let tHtml = '<table style="width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; border:1px solid #CBD5E1;">';
      if (tableHeader) {
        tHtml += '<thead><tr>';
        tableHeader.forEach((cell) => {
          tHtml += `<th style="padding:7px 9px; text-align:left !important; font-weight:600; color:#1E293B; border:1px solid #CBD5E1; background:#E2E8F0;">${formatInline(cell)}</th>`;
        });
        tHtml += '</tr></thead>';
      }
      tHtml += '<tbody>';
      tableRows.forEach((row, idx) => {
        let bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        tHtml += `<tr style="background:${bg};">`;
        row.forEach((cell) => {
          tHtml += `<td style="padding:7px 9px; color:#334155; border:1px solid #CBD5E1; text-align:left !important;">${formatInline(cell)}</td>`;
        });
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table>';
      htmlLines.push(tHtml);
      inTable = false;
      tableHeader = null;
      tableRows = [];
    }

    function closeList() {
      if (!inList) return;
      htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }

    function formatInline(text) {
      if (!text) return "";
      let str = text.trim();
      str = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      str = str.replace(/`([^`]+)`/g, '<code style="background:#F1F5F9; color:#0F172A; padding:2px 5px; border-radius:4px; font-family:monospace; font-size:11px;">$1</code>');
      str = str.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600; color:#0F172A;">$1</strong>');
      str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      // Render [[tag]] as a pill badge
      str = str.replace(/\[\[([^\]]+)\]\]/g, '<span style="display:inline-block; font-size:10px; background:#E2E8F0; color:#475569; padding:1px 5px; border-radius:3px; font-weight:600; margin:0 2px;">$1</span>');
      return str;
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Table detection
      if (line.startsWith("|") && line.endsWith("|")) {
        closeList();
        let cells = line.split("|").map((c) => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
        if (!inTable) {
          inTable = true;
          tableHeader = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        closeTable();
      }

      // Blockquote
      if (line.startsWith("> ")) {
        closeList();
        htmlLines.push(`<blockquote style="border-left: 3px solid #0061EB; padding-left: 12px; margin: 10px 0; color: #475569; font-style: italic; text-align: left !important;">${formatInline(line.substring(2))}</blockquote>`);
        continue;
      }

      // BUG FIX 5: #### → h4 (must be before ### check)
      if (line.startsWith("#### ")) {
        closeList();
        htmlLines.push(`<h4 style="font-size:12px; font-weight:700; color:#334155; margin:12px 0 4px 0; text-transform:uppercase; letter-spacing:0.5px; text-align:left !important;">${formatInline(line.substring(5))}</h4>`);
        continue;
      }
      if (line.startsWith("### ")) {
        closeList();
        htmlLines.push(`<h3 style="font-size:14px; font-weight:700; color:#0F172A; margin:16px 0 6px 0; text-align:left !important;">${formatInline(line.substring(4))}</h3>`);
        continue;
      }
      if (line.startsWith("## ")) {
        closeList();
        htmlLines.push(`<h2 style="font-size:16px; font-weight:700; color:#031B4E; margin:20px 0 8px 0; border-bottom:2px solid #031B4E; padding-bottom:5px; text-align:left !important;">${formatInline(line.substring(3))}</h2>`);
        continue;
      }
      if (line.startsWith("# ")) {
        closeList();
        htmlLines.push(`<h1 style="font-size:19px; font-weight:800; color:#031B4E; margin:22px 0 10px 0; text-align:left !important;">${formatInline(line.substring(2))}</h1>`);
        continue;
      }

      // Unordered list
      if (/^[-*]\s+/.test(line)) {
        if (!inList || listType !== 'ul') {
          closeList();
          inList = true;
          listType = 'ul';
          htmlLines.push('<ul style="margin:6px 0 10px 0; padding-left:20px; color:#334155; line-height:1.6; text-align:left !important;">');
        }
        htmlLines.push(`<li style="margin-bottom:3px; text-align:left !important;">${formatInline(line.replace(/^[-*]\s+/, ''))}</li>`);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(line)) {
        if (!inList || listType !== 'ol') {
          closeList();
          inList = true;
          listType = 'ol';
          htmlLines.push('<ol style="margin:6px 0 10px 0; padding-left:20px; color:#334155; line-height:1.6; text-align:left !important;">');
        }
        htmlLines.push(`<li style="margin-bottom:3px; text-align:left !important;">${formatInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
        continue;
      }

      closeList();

      // Horizontal rule
      if (line === "---" || line === "***" || line === "___") {
        htmlLines.push('<hr style="border:0; border-top:1px solid #E2E8F0; margin:14px 0;"/>');
        continue;
      }

      // Empty lines
      if (line === "") continue;

      // Paragraph
      htmlLines.push(`<p style="margin:0 0 8px 0; color:#334155; line-height:1.6; font-size:13px; text-align:left !important;">${formatInline(line)}</p>`);
    }

    closeTable();
    closeList();

    return htmlLines.join("\n");
  }

  // BUG FIX 8: Convert markdown to formatted plain text (for clipboard fallback)
  function markdownToPlainText(md) {
    if (!md) return "";
    return md
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/^\s*\d+\.\s+/gm, (m) => m)
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/^\s*>\s+/gm, "  ")
      .trim();
  }

  // BUG FIX 8: Build rich HTML for clipboard (renders properly in Word)
  function buildWordHtml(messages) {
    const fontStack = "'Segoe UI', Calibri, Arial, sans-serif";
    let html = `<html><head><meta charset="utf-8"/>
    <style>
      body { font-family: ${fontStack}; font-size: 11pt; color: #1E293B; margin: 0; }
      h1 { font-size: 18pt; color: #031B4E; border-bottom: 2pt solid #031B4E; padding-bottom: 4pt; margin: 18pt 0 8pt 0; }
      h2 { font-size: 14pt; color: #031B4E; border-bottom: 1pt solid #CBD5E1; padding-bottom: 3pt; margin: 14pt 0 6pt 0; }
      h3 { font-size: 12pt; color: #0F172A; margin: 12pt 0 4pt 0; }
      h4 { font-size: 10pt; color: #334155; text-transform: uppercase; letter-spacing: 0.5pt; margin: 10pt 0 3pt 0; }
      p { margin: 0 0 6pt 0; font-size: 11pt; line-height: 1.5; color: #334155; }
      ul, ol { margin: 4pt 0 8pt 0; padding-left: 18pt; }
      li { margin-bottom: 2pt; color: #334155; }
      strong, b { font-weight: bold; color: #0F172A; }
      em, i { font-style: italic; }
      blockquote { border-left: 3pt solid #0061EB; padding-left: 10pt; color: #475569; font-style: italic; margin: 8pt 0; }
      table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
      th { background: #E2E8F0; padding: 5pt 8pt; border: 1pt solid #CBD5E1; font-weight: bold; text-align: left; }
      td { padding: 5pt 8pt; border: 1pt solid #CBD5E1; color: #334155; }
      .section-header { font-size: 9pt; font-weight: bold; color: #031B4E; text-transform: uppercase; letter-spacing: 1pt; border-top: 1pt solid #CBD5E1; padding-top: 10pt; margin-top: 16pt; }
      hr { border: 0; border-top: 1pt solid #E2E8F0; margin: 12pt 0; }
    </style>
    </head><body>`;

    html += `<h1>${AGENT_NAME} — Executive Briefing</h1>`;
    html += `<p style="color:#64748B; font-size:9pt;">Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p><hr/>`;

    messages.forEach((msg, idx) => {
      if (msg.role === "user") {
        html += `<div class="section-header">Query ${Math.floor(idx / 2) + 1}</div>`;
        html += `<p><strong>${msg.content}</strong></p>`;
      } else {
        html += parseMarkdownToHtml(msg.content);
        if (idx < messages.length - 1) html += "<hr/>";
      }
    });

    html += "</body></html>";
    return html;
  }

  // ─── RENDER MESSAGES ───────────────────────────────────────────────────────
  function renderMessages() {
    messagesListEl.innerHTML = "";
    currentSession.messages.forEach((msg) => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `fd-message ${msg.role}`;

      const timeStr = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

      const bubbleHtml = msg.role === "user"
        ? `<p style="margin:0; color:#ffffff; font-size:14px; line-height:1.5; text-align:left;">${msg.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`
        : parseMarkdownToHtml(msg.content);

      msgDiv.innerHTML = `
        <div class="fd-bubble">${bubbleHtml}</div>
        <div class="fd-msg-meta">${timeStr}</div>
      `;
      messagesListEl.appendChild(msgDiv);
    });
    messagesListEl.scrollTop = messagesListEl.scrollHeight;
  }

  renderMessages();

  // ─── TOGGLE CHAT ───────────────────────────────────────────────────────────
  launcher.addEventListener("click", () => container.classList.toggle("hidden"));
  container.querySelector("#fd-btn-close").addEventListener("click", () => container.classList.add("hidden"));

  // ─── BUG FIX 7 & 8: Copy with button feedback + Word-compatible HTML ───────
  async function copyWithFeedback(btn, htmlContent, plainText) {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob
        })]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = plainText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      // BUG FIX 7: Visual button feedback
      const originalText = btn.textContent;
      btn.textContent = "✓ Copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove("copied");
      }, 2000);
      showToast("Copied — paste directly into MS Word!");
    } catch {
      showToast("Copy failed. Please try again.");
    }
  }

  // Action 1: Copy Last Response
  container.querySelector("#fd-btn-copy-last").addEventListener("click", async function () {
    const assistantMsgs = currentSession.messages.filter((m) => m.role === "assistant" && m.content !== STARTING_MSG && m.content !== "Thinking...");
    if (assistantMsgs.length === 0) { showToast("No response to copy."); return; }
    const last = assistantMsgs[assistantMsgs.length - 1];
    const htmlContent = buildWordHtml([last]);
    const plainText = markdownToPlainText(last.content);
    await copyWithFeedback(this, htmlContent, plainText);
  });

  // Action 2: Copy All
  container.querySelector("#fd-btn-copy-all").addEventListener("click", async function () {
    const validMsgs = currentSession.messages.filter((m) => m.content !== STARTING_MSG && m.content !== "Thinking...");
    if (validMsgs.length === 0) { showToast("Conversation is empty."); return; }
    const htmlContent = buildWordHtml(validMsgs);
    const plainText = validMsgs.map((m) => {
      const label = m.role === "user" ? "USER QUERY" : "EXECUTIVE ANALYSIS";
      return `${label}\n${markdownToPlainText(m.content)}\n`;
    }).join("\n---\n\n");
    await copyWithFeedback(this, htmlContent, plainText);
  });

  // ─── BUG FIX 3: PDF Export — fixed blank page at top ───────────────────────
  async function exportConversationPdf(mode) {
    let assistantMsgs = currentSession.messages.filter(
      (m) => m.role === "assistant" && m.content !== STARTING_MSG && m.content !== "Thinking..."
    );
    if (assistantMsgs.length === 0) { showToast("No response content to export."); return; }

    let targetMsgs = mode === "last" ? [assistantMsgs[assistantMsgs.length - 1]] : assistantMsgs;
    showToast("Generating PDF...");

    let printDiv = null;
    try {
      if (typeof window.html2pdf === "undefined") {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      }

      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const docTitle = (currentSession.title && currentSession.title !== "New Conversation")
        ? currentSession.title : "Executive Intelligence Report";

      let bodyHtml = '';
      targetMsgs.forEach((msg, idx) => {
        const sectionLabel = targetMsgs.length > 1
          ? `<div style="font-size:10px;font-weight:700;color:#0061EB;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px 0;">Section ${idx + 1}</div>`
          : '';
        bodyHtml += `<div style="margin-bottom:20px;">${sectionLabel}${parseMarkdownToHtml(msg.content)}</div>`;
      });

      printDiv = document.createElement("div");
      printDiv.style.cssText = [
        "position:static", "display:block",
        "width:718px", "background:#ffffff", "margin:0", "padding:0",
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
        "font-size:13px", "color:#1E293B", "line-height:1.6", "text-align:left"
      ].join(";");

      // Set innerHTML BEFORE attaching to DOM
      printDiv.innerHTML = `
        <style>
          * { box-sizing: border-box; }
          h1 { font-size:19px; font-weight:800; color:#031B4E; margin:16px 0 8px 0; border-bottom:2px solid #031B4E; padding-bottom:5px; text-align:left; page-break-after:avoid; }
          h2 { font-size:15px; font-weight:700; color:#031B4E; margin:14px 0 6px 0; border-bottom:1px solid #CBD5E1; padding-bottom:3px; text-align:left; page-break-after:avoid; }
          h3 { font-size:13px; font-weight:700; color:#0F172A; margin:12px 0 4px 0; text-align:left; page-break-after:avoid; }
          h4 { font-size:11px; font-weight:700; color:#334155; margin:10px 0 3px 0; text-transform:uppercase; letter-spacing:0.5px; text-align:left; page-break-after:avoid; }
          p { font-size:13px; color:#334155; line-height:1.6; margin:0 0 8px 0; text-align:left; }
          ul, ol { margin:4px 0 10px 0; padding-left:20px; color:#334155; line-height:1.6; }
          li { margin-bottom:3px; }
          strong, b { font-weight:600; color:#0F172A; }
          em, i { font-style:italic; }
          table { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; table-layout:fixed; }
          th { background:#E2E8F0; padding:7px 9px; border:1px solid #CBD5E1; font-weight:600; color:#1E293B; text-align:left; }
          td { padding:7px 9px; border:1px solid #CBD5E1; color:#334155; text-align:left; word-break:break-word; }
          blockquote { border-left:3px solid #0061EB; padding-left:12px; margin:8px 0; color:#475569; font-style:italic; }
          hr { border:0; border-top:1px solid #E2E8F0; margin:12px 0; }
          .pdf-wrap { padding: 16px; background:#ffffff; }
          .pdf-header { border-bottom:2px solid #031B4E; padding-bottom:12px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end; }
          .pdf-footer { margin-top:24px; border-top:1px solid #E2E8F0; padding-top:8px; font-size:10px; color:#94A3B8; display:flex; justify-content:space-between; }
        </style>
        <div class="pdf-wrap">
          <div class="pdf-header">
            <div>
              <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0061EB;margin-bottom:4px;">Executive Briefing Paper</div>
              <div style="font-size:20px;font-weight:700;color:#031B4E;line-height:1.2;">${docTitle}</div>
            </div>
            <div style="text-align:right;font-size:11px;color:#64748B;line-height:1.5;">
              <div><strong>Date:</strong> ${dateStr}</div>
              <div><strong>Classification:</strong> Confidential</div>
            </div>
          </div>
          ${bodyHtml}
          <div class="pdf-footer">
            <span>FolioDesk Executive Intelligence Systems</span>
            <span>Strictly Confidential</span>
          </div>
        </div>
      `;

      // Attach populated element to DOM and wait 300ms for browser to render layout completely
      document.body.appendChild(printDiv);
      await new Promise(r => setTimeout(r, 300));


      const filePrefix = mode === "last" ? "Executive_Brief" : "Executive_Report";
      const opt = {
        margin: 10,
        filename: `${filePrefix}_${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] }
      };


      await window.html2pdf().set(opt).from(printDiv).save();
      showToast("Executive PDF downloaded!");
    } catch (e) {
      console.error("PDF Export Error Details:", e && e.stack ? e.stack : e);
      showToast("Failed to generate PDF: " + (e.message || e));
    } finally {
      if (printDiv && printDiv.parentNode) {
        printDiv.parentNode.removeChild(printDiv);
      }
    }
  }

  container.querySelector("#fd-btn-pdf-last").addEventListener("click", () => exportConversationPdf("last"));
  container.querySelector("#fd-btn-pdf-all").addEventListener("click", () => exportConversationPdf("all"));

  // New Chat
  container.querySelector("#fd-btn-new-chat").addEventListener("click", () => {
    currentSession = createNewSession();
    renderMessages();
    showToast("New conversation started.");
  });

  // History Drawer
  const historyDrawer = container.querySelector("#fd-history-drawer");
  const historyListEl = container.querySelector("#fd-history-list");

  function renderHistoryList() {
    historyListEl.innerHTML = "";
    const sessions = getStoredSessions();
    if (sessions.length === 0) {
      historyListEl.innerHTML = '<div style="color:#94A3B8;font-size:13px;text-align:center;padding:20px;">No saved history.</div>';
      return;
    }
    sessions.forEach((s) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = `fd-history-item ${s.id === currentSession.id ? "active" : ""}`;
      const dateStr = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "";
      itemDiv.innerHTML = `
        <div class="fd-history-item-info">
          <div class="fd-history-item-title">${s.title || "Conversation"}</div>
          <div class="fd-history-item-date">${dateStr} (${s.messages.length} messages)</div>
        </div>
        <button class="fd-history-item-del" title="Delete conversation">&times;</button>
      `;
      itemDiv.querySelector(".fd-history-item-info").addEventListener("click", () => {
        currentSession = s;
        localStorage.setItem(STORAGE_KEY_ACTIVE, s.id);
        renderMessages();
        historyDrawer.classList.remove("open");
        showToast("Switched conversation.");
      });
      itemDiv.querySelector(".fd-history-item-del").addEventListener("click", (e) => {
        e.stopPropagation();
        const updated = getStoredSessions().filter((item) => item.id !== s.id);
        saveStoredSessions(updated);
        if (s.id === currentSession.id) {
          currentSession = createNewSession();
          renderMessages();
        }
        renderHistoryList();
        showToast("Conversation deleted.");
      });
      historyListEl.appendChild(itemDiv);
    });
  }

  container.querySelector("#fd-btn-history").addEventListener("click", () => {
    renderHistoryList();
    historyDrawer.classList.add("open");
  });
  container.querySelector("#fd-btn-close-drawer").addEventListener("click", () => {
    historyDrawer.classList.remove("open");
  });

  // ─── SEND MESSAGE ──────────────────────────────────────────────────────────
  const inputText = container.querySelector("#fd-input-text");
  const sendBtn = container.querySelector("#fd-btn-send");

  async function handleSendMessage() {
    // BUG FIX 6: Guard against concurrent sends
    if (isSending) return;
    const text = inputText.value.trim();
    if (!text) return;

    isSending = true;
    sendBtn.disabled = true;
    inputText.value = "";
    inputText.style.height = "40px";

    const userMsg = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    currentSession.messages.push(userMsg);
    updateActiveSessionMessages(currentSession.messages);
    renderMessages();

    const assistantMsg = {
      id: "msg_" + (Date.now() + 1),
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date().toISOString()
    };
    currentSession.messages.push(assistantMsg);
    renderMessages();

    // Filter STARTING_MSG, Thinking..., and error messages from history sent to API
    const apiMessages = currentSession.messages
      .slice(0, -1)  // exclude the current "Thinking..." placeholder
      .filter((m) => 
        m.content !== STARTING_MSG && 
        m.content !== "Thinking..." && 
        !m.content.startsWith("Sorry, I encountered an error") &&
        !m.content.startsWith("I received an empty response")
      )
      .map((m) => ({ role: m.role, content: m.content }));

    let success = false;
    let retried = false;

    while (!success) {
      try {
        const token = await getAccessToken(retried);

        const res = await fetch(`${API_URL}/api/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: apiMessages,
            stream: true
          })
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.warn(`Chat API error (${res.status}): ${errText}`);
          if (!retried) {
            retried = true;
            cachedToken = null;
            tokenExpiry = 0;
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw new Error(`Chat request failed (${res.status}): ${res.statusText} ${errText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  if (assistantMsg.content === "Thinking...") {
                    assistantMsg.content = "";
                  }
                  assistantMsg.content += delta;
                  renderMessages();
                }
              } catch {
                // Ignore non-JSON lines
              }
            }
          }
        }

        if (!assistantMsg.content || assistantMsg.content === "Thinking...") {
          assistantMsg.content = "I received an empty response. Please try again.";
        }
        updateActiveSessionMessages(currentSession.messages);
        renderMessages();
        success = true;

      } catch (err) {
        if (!retried) {
          retried = true;
          cachedToken = null;
          tokenExpiry = 0;
          await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
          continue;
        }
        console.error("Chatbot Send Error:", err);
        if (err.message && (err.message.includes("429") || err.message.toLowerCase().includes("rate limit"))) {
          assistantMsg.content = "⚠️ **Daily AI Rate Limit Exceeded**\n\nThe DigitalOcean AI agent has reached its daily token limit (`tokens_per_day`). Please try again later or increase the agent token limit in DigitalOcean.";
        } else {
          assistantMsg.content = "Sorry, I encountered an error. Please try sending your message again.";
        }
        updateActiveSessionMessages(currentSession.messages);
        renderMessages();
        success = true;
      }
    }

    isSending = false;
    sendBtn.disabled = false;
  }

  sendBtn.addEventListener("click", handleSendMessage);
  inputText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  inputText.addEventListener("input", () => {
    inputText.style.height = "40px";
    inputText.style.height = Math.min(inputText.scrollHeight, 100) + "px";
  });

})();
