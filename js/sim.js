/* =========================================================
   IT Support Journey — simulator engine
   ========================================================= */
(() => {
  'use strict';

  /* ------------------------------ helpers ------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const initials = n => n.replace(/\b(binti|bin|a\/p|a\/l)\b|Dato'/g, '').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  // avatar: photo from assets/avatars/<key>.webp if present, initials otherwise
  // remembers missing files so re-renders don't request them again
  const AV_MISS = window.ITSJ_AV_MISS = new Set();
  const avatar = (key, name, cls = '') => `<div class="avatar ${cls}">${esc(initials(name))}${AV_MISS.has(key) ? '' : `<img src="assets/avatars/${key}.webp" alt="" width="192" height="192" decoding="async" loading="lazy" onerror="ITSJ_AV_MISS.add('${key}');this.remove()">`}</div>`;
  const fmt = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('itsj:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('itsj:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const D = window.COMPANY.domain;

  /* ------------------------------ constants ---------------------------- */
  const LEVELS = [
    { xp: 0, name: 'Trainee' },
    { xp: 300, name: 'IT Support Tech I' },
    { xp: 800, name: 'IT Support Tech II' },
    { xp: 1600, name: 'Senior IT Support' },
    { xp: 3000, name: 'L2 Support Engineer' },
    { xp: 5000, name: 'IT Support Lead' }
  ];
  const SLA = { P1: 150, P2: 210, P3: 300, P4: 420 };
  const SHIFT_SIZE = 8;
  const SPAWN_EVERY = 45;
  // Button order (display) and typed-text patterns. Typed text is matched in
  // MATCH_ORDER, most specific first, so "can you try again and see?" is a retry.
  const QUESTIONS = [
    { k: 'error', label: 'What error do you see?', bm: 'Apa mesej ralat?', re: /error|message|ralat|says?\b|\bsee\b|screen|pop.?up|show(s|ing)?\b|what happen|apa jadi|keluar/ },
    { k: 'when', label: 'When did this start?', bm: 'Bila mula?', re: /\bwhen\b|start(ed)?\b|since|bila|how long|what time|pukul berapa|sejak/ },
    { k: 'restart', label: 'Have you restarted?', bm: 'Dah restart?', re: /restart|reboot|turn(ed)? (it )?off|switch(ed)? (it )?off|power (cycle|off)|mulakan semula|tutup/ },
    { k: 'computer', label: "What's your computer name?", bm: 'Nama komputer?', re: /computer|\bpc\b|laptop|desktop|hostname|machine|asset|device|komputer|sticker|\bnvr\b|which box/ },
    { k: 'others', label: 'Is anyone else affected?', bm: 'Orang lain pun sama?', re: /anyone|others|other (people|users|staff|cameras?)|colleague|everyone|\belse\b|orang lain|semua|whole (team|floor)|only you|just you/ },
    { k: 'verify', label: 'Please verify your staff ID', bm: 'ID pekerja anda?', re: /verify|staff (id|no|number)|employee|\bid\b|identity|pekerja|no\.? staf/ },
    { k: 'retry', label: 'Can you try again now?', bm: 'Cuba lagi sekarang?', re: /try (it )?again|cuba (lagi|semula)|work(s|ing)? now|is it (fixed|ok|working)|\bok now|selesai|test (it )?again|check again/ }
  ];
  const MATCH_ORDER = ['retry', 'verify', 'computer', 'others', 'restart', 'when', 'error'];
  const matchQuestion = text => {
    const v = text.toLowerCase();
    const k = MATCH_ORDER.find(key => QUESTIONS.find(q => q.k === key).re.test(v));
    return k ? QUESTIONS.find(q => q.k === k) : null;
  };

  /* ------------------------------ state -------------------------------- */
  const S = {
    agent: store.get('agent', ''),
    xp: store.get('xp', 0),
    best: store.get('best', 0),
    muted: store.get('muted', false),
    mode: 'standard',
    world: null, deck: [], tickets: [], activeId: null,
    score: 0, closed: 0, correct: 0, csat: [], xpGained: 0,
    elapsed: 0, nextSpawn: 0, paused: true, running: false,
    session: null, seq: 1040, selUser: null, timer: null
  };

  /* ------------------------------ audio -------------------------------- */
  let actx;
  function beep(type) {
    if (S.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const seqs = {
        ticket: [[660, 0, .08], [880, .09, .1]],
        good: [[523, 0, .1], [659, .1, .1], [784, .2, .18]],
        bad: [[220, 0, .18], [180, .16, .22]],
        click: [[1200, 0, .03]],
        level: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .3]],
        msg: [[990, 0, .05]]
      }[type] || [];
      seqs.forEach(([f, t, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type === 'bad' ? 'sawtooth' : 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(.0001, actx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(.12, actx.currentTime + t + .01);
        g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + t + d);
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + t); o.stop(actx.currentTime + t + d + .02);
      });
    } catch (e) { /* audio unavailable */ }
  }

  /* ------------------------------ toasts / fx -------------------------- */
  function toast(msg, kind = 'info', icon = 'ℹ️') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `<span>${msg}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => el.remove(), 4100);
  }

  function floatText(text, x, y, kind) {
    const el = document.createElement('div');
    el.className = 'float-pts ' + kind;
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  /* confetti */
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], confRAF = null;
  function confetti(n = 140) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ['#ffffff', '#e0e0e0', '#bdbdbd', '#8a8a8a', '#ffffff', '#5c5c5c'];
    for (let i = 0; i < n; i++) parts.push({
      x: innerWidth / 2 + rand(-120, 120), y: innerHeight / 3, vx: rand(-9, 9), vy: rand(-13, -4),
      r: rand(4, 8), c: colors[i % colors.length], rot: rand(0, 6), vr: rand(-.3, .3), life: 1
    });
    if (!confRAF) confRAF = requestAnimationFrame(confTick);
  }
  function confTick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.rot += p.vr; p.life -= .007;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.max(0, p.life);
      cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); cx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
    confRAF = parts.length ? requestAnimationFrame(confTick) : (cx.clearRect(0, 0, cv.width, cv.height), null);
  }

  /* ------------------------------ levels / HUD ------------------------- */
  const levelOf = xp => { let i = 0; LEVELS.forEach((l, j) => { if (xp >= l.xp) i = j; }); return i; };

  function renderHUD() {
    const li = levelOf(S.xp), cur = LEVELS[li], nxt = LEVELS[li + 1];
    $('#agentName').textContent = S.agent || 'Agent';
    $('#agentAvatar').innerHTML = esc((S.agent || 'A')[0].toUpperCase()) + (AV_MISS.has('agent') ? '' : '<img src="assets/avatars/agent.webp" alt="" width="192" height="192" decoding="async" onerror="ITSJ_AV_MISS.add(\'agent\');this.remove()">');
    $('#agentLevel').textContent = `Lv ${li + 1} · ${cur.name}`;
    const pct = nxt ? (S.xp - cur.xp) / (nxt.xp - cur.xp) * 100 : 100;
    $('#xpFill').style.width = pct + '%';
    $('#xpText').textContent = nxt ? `${S.xp} / ${nxt.xp} XP` : `${S.xp} XP · MAX`;
    $('#score').textContent = S.score;
    $('#closed').textContent = `${S.closed}/${SHIFT_SIZE}`;
    $('#csat').textContent = S.csat.length ? (S.csat.reduce((a, b) => a + b, 0) / S.csat.length).toFixed(1) + '★' : '–';
    $('#clock').textContent = fmt(S.elapsed);
    $('#muteBtn').textContent = S.muted ? 'Sound off' : 'Sound on';
  }

  function bump(sel) {
    const el = $(sel); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  const timed = () => S.mode !== 'training';   // SLA clock runs in Standard and Expert
  const expert = () => S.mode === 'expert';    // no question buttons, no hints, no giveaways

  /* ------------------------------ world -------------------------------- */
  // fresh copy of everything a shift can change
  function newWorld() {
    return { users: clone(window.DIRECTORY), hosts: clone(window.HOSTS), mail: clone(window.MAIL || {}), traced: [], outage: false };
  }

  /* ------------------------------ shift lifecycle ---------------------- */
  function startShift() {
    S.world = newWorld();
    const escs = window.SCENARIOS.filter(s => s.escalate), fix = window.SCENARIOS.filter(s => !s.escalate);
    S.deck = shuffle([...shuffle(escs).slice(0, 2), ...shuffle(fix).slice(0, SHIFT_SIZE - 2)]);
    // ?s=<scenario id> puts a specific scenario first (linked from the landing page)
    const want = new URLSearchParams(location.search).get('s');
    const picked = window.SCENARIOS.find(s => s.id === want);
    if (picked) S.deck = [picked, ...S.deck.filter(s => s !== picked)].slice(0, SHIFT_SIZE);
    Object.assign(S, { tickets: [], activeId: null, score: 0, closed: 0, correct: 0, csat: [], xpGained: 0, elapsed: 0, session: null, selUser: null, paused: false, running: true });
    S.nextSpawn = 8;
    $('#queueList').innerHTML = '';
    S.mailUser = null; S.mailQ = ''; S.traceQ = ''; S.traceOpen = null;
    renderTicket(); renderDirectory(); renderRemote(); renderMail(); termReset(); renderHUD();
    spawn(); setTimeout(spawn, 1200);
    clearInterval(S.timer);
    S.timer = setInterval(tick, 1000);
  }

  function tick() {
    if (S.paused || !S.running) return;
    S.elapsed++;
    const open = S.tickets.filter(t => t.status === 'open');
    if (timed()) {
      open.forEach(t => {
        t.slaLeft--;
        if (t.slaLeft <= 0 && !t.breached) {
          t.breached = true;
          toast(`${t.id} breached its SLA`, 'bad', '⏰'); beep('bad');
        }
      });
    }
    if (S.deck.length && (S.elapsed >= S.nextSpawn || open.length === 0)) spawn();
    updateSLAs();
    $('#clock').textContent = fmt(S.elapsed);
  }

  function spawn() {
    if (!S.deck.length) return;
    const sc = S.deck.shift();
    sc.setup(S.world);
    renderMail(); // setup may add quarantine / trace entries
    const t = {
      id: 'INC-' + (++S.seq), sc, status: 'open', created: S.elapsed,
      slaTotal: SLA[sc.priority], slaLeft: SLA[sc.priority], breached: false,
      asked: new Set(), chat: [{ from: 'user', text: sc.body }], log: [], flags: [], hints: 0, seen: false, busy: false
    };
    S.tickets.push(t);
    S.nextSpawn = S.elapsed + SPAWN_EVERY;
    renderQueue(t.id);
    toast(`New ticket <b>${t.id}</b> · ${esc(sc.title)}`, 'info', '🎫'); beep('ticket');
    if (!S.activeId) openTicket(t.id);
  }

  /* ------------------------------ queue -------------------------------- */
  const targetsOf = sc => sc.targets || [sc.user];
  const activeTicket = () => S.tickets.find(t => t.id === S.activeId && t.status === 'open') || null;

  function renderQueue(newId) {
    const list = $('#queueList');
    const open = S.tickets.filter(t => t.status === 'open').sort((a, b) => a.sc.priority.localeCompare(b.sc.priority) || a.created - b.created);
    $('#queueCount').textContent = open.length;
    if (!open.length) {
      list.innerHTML = `<div class="empty-mini">${S.deck.length ? 'Queue empty. Next ticket soon.' : 'All caught up.'}</div>`;
      return;
    }
    list.innerHTML = open.map(t => {
      const u = S.world.users[t.sc.user];
      return `<button class="q-card ${t.id === S.activeId ? 'active' : ''} ${t.id === newId ? 'new' : ''} ${t.seen ? '' : 'unseen'}" data-id="${t.id}">
        <div class="q-top"><span class="prio ${t.sc.priority}">${t.sc.priority}</span><span class="q-id">${t.id}</span><span class="q-cat">${t.sc.category}</span></div>
        <div class="q-title">${esc(t.sc.title)}</div>
        <div class="q-user">${esc(u.name)} · ${esc(u.dept)}</div>
        <div class="sla"><span style="width:${timed() ? Math.max(0, t.slaLeft / t.slaTotal * 100) : 100}%"></span></div>
      </button>`;
    }).join('');
    $$('.q-card', list).forEach(b => b.addEventListener('click', () => { beep('click'); openTicket(b.dataset.id, true); }));
    updateSLAs();
  }

  function updateSLAs() {
    S.tickets.filter(t => t.status === 'open').forEach(t => {
      const pct = timed() ? Math.max(0, t.slaLeft / t.slaTotal * 100) : 100;
      const cls = pct < 25 ? 'crit' : pct < 50 ? 'warn' : '';
      const card = $(`.q-card[data-id="${t.id}"] .sla`);
      if (card) { card.className = 'sla ' + cls; card.firstElementChild.style.width = pct + '%'; }
      if (t.id === S.activeId) {
        const big = $('#tSla');
        if (big) {
          big.className = 'sla big ' + cls;
          big.firstElementChild.style.width = pct + '%';
          $('#tSlaText').textContent = timed() ? (t.breached ? 'SLA BREACHED' : fmt(t.slaLeft) + ' left') : 'Training mode, no SLA';
        }
      }
    });
  }

  /* ------------------------------ ticket view -------------------------- */
  function openTicket(id, fromClick) {
    S.activeId = id;
    const t = activeTicket();
    if (t) t.seen = true;
    renderQueue(); renderTicket();
    if (fromClick && window.innerWidth < 1000) $('#ticketPane').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderTicket() {
    const pane = $('#ticketPane');
    const t = activeTicket();
    if (!t) {
      pane.innerHTML = `<div class="empty-state"><h3>No ticket selected</h3><p>Pick a ticket from the queue to start helping.</p></div>`;
      return;
    }
    const u = S.world.users[t.sc.user];
    const hostKnown = t.asked.has('computer') && t.sc.host;
    pane.innerHTML = `
      <div class="t-head">
        <div>
          <div class="t-meta"><span class="prio ${t.sc.priority}">${t.sc.priority}</span><span class="q-id">${t.id}</span><span class="chip">${t.sc.category}</span></div>
          <h2>${esc(t.sc.title)}</h2>
        </div>
        <div class="t-sla"><div class="sla big" id="tSla"><span></span></div><small id="tSlaText"></small></div>
      </div>
      <div class="requester">
        ${avatar(t.sc.user, u.name, 'sm')}
        <div class="r-info"><b>${esc(u.name)}</b><small>${esc(u.title)} · ${esc(u.dept)}</small></div>
        <div class="r-device">${hostKnown
          ? `<span class="mono">${t.sc.host}</span><button class="btn xs" id="quickConnect">Connect ↗</button>`
          : `<span class="muted">Device: ask the user</span>`}</div>
      </div>
      <div class="chat" id="chat">${t.chat.map(chatBubble).join('')}</div>
      ${expert() ? `<div class="expert-note">Expert mode: type your questions to ${esc(u.name.split(' ')[0])}. You can write in English or BM.</div>` : ''}
      <div class="chips ${expert() ? 'hidden' : ''}" id="chips">${QUESTIONS.map(q => `<button class="q-chip ${t.asked.has(q.k) && q.k !== 'retry' ? 'used' : ''}" data-k="${q.k}">${q.label}<small>${q.bm}</small></button>`).join('')}</div>
      <form class="chat-in" id="chatForm"><input id="chatInput" placeholder="Type a message to ${esc(u.name.split(' ')[0])}…" autocomplete="off"><button class="btn primary sm">Send</button></form>
      <div class="t-foot">
        ${expert() ? '' : `<button class="btn ghost sm" id="hintBtn">Hint${S.mode === 'standard' ? ' (−10)' : ''}</button>`}
        <button class="btn ghost sm" id="logBtn">Activity (${t.log.length})</button>
        <span class="spacer"></span>
        <button class="btn primary" id="closeBtn">Close ticket →</button>
      </div>
      <div class="activity hidden" id="activity">${t.log.length ? t.log.map(l => `<div><span class="mono muted">${fmt(l.at)}</span> ${esc(l.text)}</div>`).join('') : '<div class="muted">No actions taken yet.</div>'}</div>`;
    pane.classList.remove('enter'); void pane.offsetWidth; pane.classList.add('enter');
    scrollChat();
    updateSLAs();
    $$('.q-chip', pane).forEach(b => b.addEventListener('click', () => ask(t, b.dataset.k)));
    $('#chatForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#chatInput').value.trim(); if (!v) return;
      $('#chatInput').value = '';
      const q = matchQuestion(v);
      ask(t, q ? q.k : null, v);
    });
    if ($('#hintBtn')) $('#hintBtn').addEventListener('click', () => showHint(t));
    $('#logBtn').addEventListener('click', () => $('#activity').classList.toggle('hidden'));
    $('#closeBtn').addEventListener('click', () => openClose(t));
    const qc = $('#quickConnect');
    if (qc) qc.addEventListener('click', () => { switchTab('remote'); connect(t.sc.host); });
  }

  function chatBubble(m) {
    if (m.from === 'sys') return `<div class="bubble sys">${m.text}</div>`;
    return `<div class="bubble ${m.from}">${esc(m.text)}</div>`;
  }
  function scrollChat() { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; }

  async function ask(t, key, freeText) {
    if (t.busy) return;
    const q = QUESTIONS.find(x => x.k === key);
    const text = freeText || q.label;
    t.chat.push({ from: 'agent', text });
    appendBubble({ from: 'agent', text }, t);
    if (key) t.asked.add(key);
    $$('.q-chip').forEach(b => { if (b.dataset.k === key && key !== 'retry') b.classList.add('used'); });
    t.busy = true;
    const chat = $('#chat');
    if (chat && S.activeId === t.id) {
      const typing = document.createElement('div');
      typing.className = 'bubble user typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      chat.appendChild(typing); scrollChat();
    }
    await sleep(rand(700, 1500));
    t.busy = false;
    $$('.typing').forEach(e => e.remove());
    const reply = answerFor(t, key);
    t.chat.push({ from: 'user', text: reply });
    if (key === 'computer' && t.sc.host) {
      t.chat.push({ from: 'sys', text: `Device noted: <b class="mono">${t.sc.host}</b> — you can connect from Remote or Terminal.` });
    }
    if (S.activeId === t.id) {
      if (key === 'computer') renderTicket();
      else appendBubble({ from: 'user', text: reply }, t);
    }
    beep('msg');
  }

  function appendBubble(m, t) {
    if (S.activeId !== t.id) return;
    const chat = $('#chat'); if (!chat) return;
    chat.insertAdjacentHTML('beforeend', chatBubble(m));
    scrollChat();
  }

  function answerFor(t, key) {
    const sc = t.sc;
    if (key === 'retry') {
      if (sc.escalate) return "Still the same… are you passing this to another team?";
      return sc.check(S.world) ? 'Eh, it works now! Terima kasih banyak-banyak 🙏' : 'Hmm, still the same problem leh.';
    }
    if (key && sc.answers[key]) return sc.answers[key];
    if (key === 'verify') return 'Sure, it\'s ' + S.world.users[sc.user].empId + '.';
    return ["Sorry ah, I'm not very technical — what do you need me to do?", 'Hmm, not sure. Can you ask in a simpler way?', 'Erm… I don\'t know. Is that important?'][Math.floor(Math.random() * 3)];
  }

  function showHint(t) {
    t.hints++;
    t.chat.push({ from: 'sys', text: '<b>Senior tech:</b> ' + esc(t.sc.hint) });
    appendBubble(t.chat[t.chat.length - 1], t);
    beep('click');
  }

  /* ------------------------------ action logging ----------------------- */
  function addFlag(t, key, label, pts) {
    if (t.flags.some(f => f.key === key)) return;
    t.flags.push({ key, label, pts });
    toast(label, pts <= -100 ? 'bad' : 'warn', pts <= -100 ? '🚨' : '⚠️');
    beep('bad');
    const pane = $('#ticketPane'); pane.classList.remove('shake'); void pane.offsetWidth; pane.classList.add('shake');
  }

  function act(kind, text, { user = null, sensitive = false, harmful = null } = {}) {
    const t = activeTicket();
    if (!t) { toast('Tip: open a ticket first so your work gets logged.', 'info', '📝'); return; }
    t.log.push({ at: S.elapsed, text });
    const lb = $('#logBtn'); if (lb) lb.textContent = `Activity (${t.log.length})`;
    const actEl = $('#activity'); if (actEl) actEl.innerHTML = t.log.map(l => `<div><span class="mono muted">${fmt(l.at)}</span> ${esc(l.text)}</div>`).join('');
    const mine = user && targetsOf(t.sc).includes(user);
    if (user && !mine) {
      const otherOpen = S.tickets.some(o => o.status === 'open' && targetsOf(o.sc).includes(user));
      if (!otherOpen) addFlag(t, 'wrong-' + user, `Changed an unrelated account (${S.world.users[user].name})`, -40);
    }
    if (sensitive && mine) {
      if (t.sc.verifyFails) addFlag(t, 'compromised', 'Gave access to an unverified caller — account takeover!', -150);
      else if (!t.asked.has('verify')) addFlag(t, 'noverify', 'Sensitive change without verifying identity', -40);
    }
    if (harmful) addFlag(t, harmful.key, harmful.label, harmful.pts);
    if (t.sc.avoid && t.sc.avoid[kind] && mine) addFlag(t, 'avoid-' + kind, t.sc.avoid[kind].label, t.sc.avoid[kind].pts);
  }

  /* ------------------------------ tabs --------------------------------- */
  function switchTab(name) {
    $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab-body').forEach(b => b.classList.toggle('active', b.id === 'tab-' + name));
    const ind = $('.tabs .ind'), btn = $(`.tabs button[data-tab="${name}"]`);
    if (ind && btn) { ind.style.width = btn.offsetWidth + 'px'; ind.style.transform = `translateX(${btn.offsetLeft}px)`; }
    if (name === 'term') setTimeout(() => $('#termInput').focus(), 50);
  }

  /* ------------------------------ directory ---------------------------- */
  function renderDirectory() {
    const q = ($('#dirSearch').value || '').toLowerCase().trim();
    const users = S.world ? S.world.users : {};
    const rows = Object.entries(users).filter(([k, u]) => !q || (k + ' ' + u.name + ' ' + u.dept + ' ' + u.empId).toLowerCase().includes(q));
    $('#dirResults').innerHTML = rows.map(([k, u]) => `
      <button class="d-row ${S.selUser === k ? 'active' : ''}" data-u="${k}">
        ${avatar(k, u.name, 'xs')}
        <div><b>${esc(u.name)}</b><small>${k}@${D} · ${esc(u.dept)}</small></div>
        <span class="dots ${expert() ? 'hidden' : ''}">${!u.enabled ? '<i class="d off" title="Disabled"></i>' : ''}${u.locked ? '<i class="d lock" title="Locked"></i>' : ''}${u.pwdExpired ? '<i class="d exp" title="Password expired"></i>' : ''}</span>
      </button>`).join('') || '<div class="empty-mini">No matching users</div>';
    $$('.d-row').forEach(r => r.addEventListener('click', () => { S.selUser = r.dataset.u; beep('click'); renderDirectory(); }));
    renderUserCard();
  }

  function renderUserCard() {
    const box = $('#dirDetail');
    const k = S.selUser, u = k && S.world && S.world.users[k];
    if (!u) { box.innerHTML = '<div class="empty-mini">Select a user to view their account.</div>'; return; }
    const chip = (ok, yes, no) => `<span class="st ${ok ? 'ok' : 'bad'}">${ok ? yes : no}</span>`;
    box.innerHTML = `
      <div class="u-card pop">
        <div class="u-head">${avatar(k, u.name)}<div><b>${esc(u.name)}</b><small>${esc(u.title)} · ${esc(u.dept)}</small><small class="mono">${k}@${D} · ${u.empId} · ${u.phone}</small></div></div>
        <div class="u-status">
          ${chip(u.enabled, 'Enabled', 'Disabled')}
          ${chip(!u.locked, 'Not locked', 'Locked out')}
          ${chip(!u.pwdExpired, 'Password OK', 'Password expired')}
          ${chip(u.mfa === 'Registered', 'MFA: ' + u.mfa, 'MFA: ' + u.mfa)}
        </div>
        <div class="u-groups"><small class="muted">Groups</small><div>${u.groups.map(g => `<span class="grp ${g === 'Domain Admins' ? 'danger' : ''}">${g}<button data-rm="${g}" title="Remove">×</button></span>`).join('') || '<span class="muted">none</span>'}</div>
          <div class="add-grp"><select id="grpSel">${window.GROUPS.filter(g => !u.groups.includes(g)).map(g => `<option>${g}</option>`).join('')}</select><button class="btn xs" id="grpAdd">+ Add</button></div>
        </div>
        <div class="u-actions">
          <button class="btn sm" id="aUnlock" ${u.locked || expert() ? '' : 'disabled'}>Unlock</button>
          <button class="btn sm" id="aReset">Reset password</button>
          <button class="btn sm" id="aMfa">Reset MFA</button>
          <button class="btn sm ${u.enabled ? 'danger-o' : ''}" id="aToggle">${u.enabled ? 'Disable' : 'Enable'}</button>
        </div>
        <div id="resetBox"></div>
      </div>`;

    const run = r => { toast(esc(r.msg), r.ok ? 'good' : 'warn'); beep('click'); renderDirectory(); };
    $('#aUnlock').onclick = () => run(OPS.unlock(k));
    $('#aToggle').onclick = () => run(OPS.setEnabled(k, !u.enabled));
    $('#aMfa').onclick = () => run(OPS.resetMfa(k));
    $('#aReset').onclick = () => {
      const pw = tempPassword();
      $('#resetBox').innerHTML = `<div class="reset-box pop"><div>Temporary password: <code>${pw}</code></div>
        <label><input type="checkbox" id="mustChange" checked> User must change password at next logon</label>
        <div class="row"><button class="btn xs primary" id="rsGo">Confirm reset</button><button class="btn xs ghost" id="rsNo">Cancel</button></div></div>`;
      $('#rsNo').onclick = () => { $('#resetBox').innerHTML = ''; };
      $('#rsGo').onclick = () => run(OPS.resetPwd(k, $('#mustChange').checked, pw));
    };
    $('#grpAdd').onclick = () => { const g = $('#grpSel').value; if (g) run(OPS.addGroup(k, g)); };
    $$('[data-rm]', box).forEach(b => b.onclick = () => run(OPS.removeGroup(k, b.dataset.rm)));
  }

  /* ------------------------------ shared admin actions ----------------- */
  // Every change made from the Directory, Mail panel or Terminal goes through
  // here, so buttons and typed commands are logged and graded the same way.
  // Each returns { ok, msg }.
  const tempPassword = () => ['Kopi', 'Durian', 'Rambutan', 'Nasi', 'Cendol', 'Mangga'][Math.floor(Math.random() * 6)] + '-' +
    ['Harimau', 'Gajah', 'Helang', 'Rusa'][Math.floor(Math.random() * 4)] + '-' + Math.floor(rand(10, 99)) + '!';
  const fail = msg => ({ ok: false, msg });
  const okr = msg => ({ ok: true, msg });

  const OPS = {
    /* --- directory --- */
    unlock(k) {
      const u = S.world.users[k];
      if (!u.locked) return fail(`${u.name}'s account is not locked out.`);
      u.locked = false;
      act('unlock', `Unlocked account ${k}`, { user: k });
      return okr(`Unlocked ${u.name}'s account.`);
    },
    setEnabled(k, on) {
      const u = S.world.users[k];
      if (u.enabled === on) return fail(`${u.name}'s account is already ${on ? 'enabled' : 'disabled'}.`);
      u.enabled = on;
      act(on ? 'enable' : 'disable', `${on ? 'Enabled' : 'Disabled'} account ${k}`, {
        user: k, harmful: on ? null : { key: 'disabled-' + k, label: `Disabled ${u.name}'s active account`, pts: -50 }
      });
      return okr(`${on ? 'Enabled' : 'Disabled'} ${u.name}'s account.`);
    },
    resetPwd(k, mustChange = true, pw = tempPassword()) {
      const u = S.world.users[k];
      u.pwdExpired = false; u.locked = false;
      act('resetPwd', `Reset password for ${k}${mustChange ? ' (must change at next logon)' : ''}`, {
        user: k, sensitive: true, harmful: mustChange ? null : { key: 'nochange', label: 'Temp password not forced to change', pts: -10 }
      });
      return okr(`Password reset for ${u.name}. Temporary password: ${pw}${mustChange ? ' (must change at next logon)' : ''}`);
    },
    resetMfa(k) {
      const u = S.world.users[k];
      u.mfa = 'Pending re-registration'; u.mfaReset = true;
      act('resetMfa', `Reset MFA registration for ${k}`, { user: k, sensitive: true });
      return okr(`MFA reset for ${u.name}. They will register a new device at next sign-in.`);
    },
    addGroup(k, g) {
      const u = S.world.users[k];
      if (!window.GROUPS.includes(g)) return fail(`Group "${g}" not found.`);
      if (u.groups.includes(g)) return fail(`${u.name} is already in ${g}.`);
      u.groups.push(g);
      act('addGroup', `Added ${k} to ${g}`, {
        user: k, harmful: g === 'Domain Admins' ? { key: 'da-' + k, label: 'Granted Domain Admins — huge security risk!', pts: -200 } : null
      });
      return okr(`Added ${u.name} to ${g}.`);
    },
    removeGroup(k, g) {
      const u = S.world.users[k];
      if (!u.groups.includes(g)) return fail(`${u.name} is not in ${g}.`);
      u.groups = u.groups.filter(x => x !== g);
      act('removeGroup', `Removed ${k} from ${g}`, { user: k });
      return okr(`Removed ${u.name} from ${g}.`);
    },

    /* --- mail --- */
    licence(k) {
      const M = S.world.mail, b = M.boxes[k];
      if (b.licensed) return fail(`${uname(k)} already has a licence.`);
      if (M.licencesFree < 1) return fail('No licences left. Raise a purchase request.');
      M.licencesFree--; b.licensed = true;
      act('licence', `Assigned a Microsoft 365 licence to ${k}`, { user: k });
      return okr(`Licence assigned to ${uname(k)}. The mailbox is being created.`);
    },
    archive(k) {
      const b = S.world.mail.boxes[k];
      if (!b.licensed) return fail(`${uname(k)} has no mailbox.`);
      if (b.archive) return fail(`Archive is already enabled for ${uname(k)}.`);
      const before = b.size; b.archive = true; b.size = +(b.size * 0.35).toFixed(1);
      act('archive', `Enabled online archive for ${k} (${before} → ${b.size} GB)`, { user: k });
      return okr(`Online archive enabled for ${uname(k)}. Mailbox ${before} GB → ${b.size} GB.`);
    },
    autoReply(k, text) {
      const b = S.world.mail.boxes[k];
      b.autoReply = text || null;
      act(text ? 'oooOn' : 'oooOff', `Turned ${text ? 'on' : 'off'} automatic replies for ${k}`, { user: k });
      return okr(`Automatic replies ${text ? 'on' : 'off'} for ${uname(k)}.`);
    },
    forwardOff(k) {
      const b = S.world.mail.boxes[k];
      if (!b.forward) return fail(`${uname(k)} has no forwarding set.`);
      const f = b.forward; b.forward = null;
      act('fwdRm', `Removed forwarding to ${f} on ${k}`, { user: k });
      return okr(`Removed forwarding to ${f}.`);
    },
    ruleRemove(k, nameOrIndex) {
      const b = S.world.mail.boxes[k];
      const i = typeof nameOrIndex === 'number' ? nameOrIndex : b.rules.findIndex(r => r.name === nameOrIndex);
      if (i < 0 || !b.rules[i]) return fail(`No inbox rule "${nameOrIndex}" on ${uname(k)}'s mailbox.`);
      const r = b.rules.splice(i, 1)[0];
      act('ruleRm', `Deleted inbox rule "${r.name}" on ${k}`, { user: k });
      return okr(`Deleted inbox rule "${r.name}".`);
    },
    calAdd(owner, k, role) {
      if (owner === k) return fail('That person already owns this calendar.');
      if (!['Reviewer', 'Editor'].includes(role)) return fail('Access rights must be Reviewer or Editor.');
      const b = S.world.mail.boxes[owner];
      b.cal = b.cal.filter(c => c.u !== k); b.cal.push({ u: k, role });
      act('calAdd', `Gave ${k} ${role} access to ${owner}'s calendar`, { user: owner });
      return okr(`${uname(k)} now has ${role} access to ${uname(owner)}'s calendar.`);
    },
    calRemove(owner, k) {
      const b = S.world.mail.boxes[owner];
      if (!b.cal.some(c => c.u === k)) return fail(`${uname(k)} has no access to ${uname(owner)}'s calendar.`);
      b.cal = b.cal.filter(c => c.u !== k);
      act('calRm', `Removed ${k} from ${owner}'s calendar`, { user: owner });
      return okr(`Removed ${uname(k)} from ${uname(owner)}'s calendar.`);
    },
    sharedAdd(box, k, perm) {
      const g = S.world.mail.shared[box], list = perm === 'Send As' ? g.sendAs : g.full;
      if (list.includes(k)) return fail(`${uname(k)} already has ${perm} on ${mailAddr(box)}.`);
      list.push(k);
      act(perm === 'Send As' ? 'sendAsAdd' : 'mbxAdd', `Gave ${k} ${perm} on ${mailAddr(box)}`, { user: k });
      return okr(`${uname(k)} now has ${perm} on ${mailAddr(box)}.`);
    },
    sharedRemove(box, k, perm) {
      const g = S.world.mail.shared[box], key = perm === 'Send As' ? 'sendAs' : 'full';
      if (!g[key].includes(k)) return fail(`${uname(k)} doesn't have ${perm} on ${mailAddr(box)}.`);
      g[key] = g[key].filter(x => x !== k);
      act(perm === 'Send As' ? 'sendAsRm' : 'mbxRm', `Removed ${k}'s ${perm} on ${mailAddr(box)}`, { user: k });
      return okr(`Removed ${uname(k)}'s ${perm} on ${mailAddr(box)}.`);
    },
    dlAdd(list, k) {
      const g = S.world.mail.dls[list];
      if (g.dynamic) return fail(`${mailAddr(list)} is dynamic. Membership is automatic.`);
      if (g.members.includes(k)) return fail(`${uname(k)} is already in ${mailAddr(list)}.`);
      g.members.push(k);
      act('dlAdd', `Added ${k} to ${mailAddr(list)}`, { user: k });
      return okr(`Added ${uname(k)} to ${mailAddr(list)}.`);
    },
    dlRemove(list, k) {
      const g = S.world.mail.dls[list];
      if (!g.members.includes(k)) return fail(`${uname(k)} is not in ${mailAddr(list)}.`);
      g.members = g.members.filter(x => x !== k);
      act('dlRm', `Removed ${k} from ${mailAddr(list)}`, { user: k });
      return okr(`Removed ${uname(k)} from ${mailAddr(list)}.`);
    },
    qRelease(id) {
      const q = S.world.mail.quarantine.find(x => x.id === id);
      if (!q) return fail(`No quarantined message with id ${id}.`);
      if (q.state !== 'held') return fail(`That message was already ${q.state}.`);
      q.state = 'released';
      act('release', `Released "${q.subject}" to ${q.to}`, {
        harmful: q.malicious ? { key: 'rel-' + q.id, label: 'Released a phishing email to a user', pts: -100 } : null
      });
      return okr(`Released "${q.subject}" to ${mailAddr(q.to)}.`);
    },
    qDelete(id) {
      const q = S.world.mail.quarantine.find(x => x.id === id);
      if (!q) return fail(`No quarantined message with id ${id}.`);
      if (q.state !== 'held') return fail(`That message was already ${q.state}.`);
      q.state = 'deleted';
      act('qdelete', `Deleted quarantined "${q.subject}"`, {
        harmful: q.malicious ? null : { key: 'qdel-' + q.id, label: 'Deleted a legitimate email from quarantine', pts: -20 }
      });
      return okr(`Deleted "${q.subject}".`);
    },
    // returns matching trace entries and marks them as looked at
    trace(query) {
      const q = String(query || '').toLowerCase().trim();
      if (q.length < 2) return [];
      const keys = Object.entries(S.world.users).filter(([k, u]) => k.includes(q) || u.name.toLowerCase().includes(q)).map(([k]) => k);
      const res = S.world.mail.trace.filter(e => [e.from, e.to].some(x => mailAddr(x).toLowerCase().includes(q) || keys.includes(x))).reverse();
      res.forEach(e => { if (!S.world.traced.includes(e.id)) S.world.traced.push(e.id); });
      return res;
    }
  };

  /* ------------------------------ remote ------------------------------- */
  function connect(host) {
    host = (host || '').toUpperCase().trim();
    const h = S.world && S.world.hosts[host];
    if (!h) { toast(`Host ${esc(host)} not found on the network`, 'warn', '🖥️'); return false; }
    S.session = { host, guided: h.apipa };
    renderRemote(true);
    termPrompt();
    termPrint(h.apipa
      ? [`Connecting to ${host}… failed (host unreachable).`, `Starting guided session — ${S.world.users[h.owner].name} will run commands for you.`]
      : [`Connected to ${host} as ${D.split('.')[0].toUpperCase()}\\helpdesk.`], h.apipa ? 'warn' : 'ok');
    toast(`Remote session: ${host}${h.apipa ? ' (guided)' : ''}`, 'info', '🖥️');
    return true;
  }

  function renderRemote(animate) {
    const box = $('#remoteBody');
    if (!S.session) {
      box.innerHTML = `<form class="connect pop" id="connForm"><p>Connect to a user's computer.<br><small class="muted">Ask the user for their computer name first.</small></p>
        <div class="row"><input id="connHost" placeholder="e.g. XYZ-HR-022" autocomplete="off" class="mono"><button class="btn primary sm">Connect</button></div></form>`;
      $('#connForm').onsubmit = e => { e.preventDefault(); connect($('#connHost').value); };
      return;
    }
    const host = S.session.host, h = S.world.hosts[host];
    if (h.type === 'nvr') return renderNvr(box, host, h, animate);
    const owner = S.world.users[h.owner];
    const diskCls = h.disk >= 90 ? 'crit' : h.disk >= 75 ? 'warn' : '';
    box.innerHTML = `
      <div class="host ${animate ? 'pop' : ''}">
        <div class="host-head"><div><span class="pulse-dot ${S.session.guided ? 'warn' : ''}"></span><b class="mono">${host}</b>${S.session.guided ? ' <span class="st warn">guided</span>' : ''}</div><button class="btn xs ghost" id="disc">Disconnect</button></div>
        <div class="kv"><span>User</span><b>${esc(owner.name)}</b></div>
        <div class="kv"><span>OS</span><b>${h.os}</b></div>
        <div class="kv"><span>IPv4</span><b class="mono ${h.apipa ? 'bad-t' : ''}">${h.apipa ? '169.254.88.12' : h.ip}</b></div>
        <div class="kv"><span>Disk C:</span><b>${h.disk}%</b></div>
        <div class="meter ${diskCls}"><span style="width:${h.disk}%"></span></div>
        <h4>Services</h4>
        <div class="svc"><span>Print Spooler</span><span class="st ${h.spooler === 'Running' ? 'ok' : 'bad'}">${h.spooler}</span><button class="btn xs" data-op="spooler">Restart</button></div>
        <div class="svc"><span>Print queue</span><span class="st ${h.queue ? 'bad' : 'ok'}">${h.queue} job${h.queue === 1 ? '' : 's'}</span></div>
        <div class="svc"><span>Outlook</span><span class="st ${h.outlook === 'Healthy' ? 'ok' : 'bad'}">${h.outlook}</span><button class="btn xs" data-op="outlook">Rebuild profile</button></div>
        <h4>Maintenance</h4>
        <div class="ops"><button class="btn sm" data-op="cleanup">Disk Cleanup</button><button class="btn sm" data-op="reboot">Restart PC</button></div>
        <h4>Software Center</h4>
        <div class="soft">${window.SOFTWARE.map(s => {
          const inst = h.software.includes(s.name);
          return `<div class="sw"><span>${s.name}</span><span class="pol ${s.policy}">${s.policy === 'approved' ? 'Approved' : s.policy === 'license' ? 'License req.' : 'Blocked'}</span>${inst ? '<span class="st ok">Installed</span>' : `<button class="btn xs" data-install="${s.name}">Install</button>`}</div>`;
        }).join('')}</div>
        <div class="progress hidden" id="opProg"><div class="bar"><span></span></div><small id="opText"></small></div>
      </div>`;
    $('#disc').onclick = () => { S.session = null; renderRemote(); termPrompt(); termPrint(['Session closed.']); };
    $$('[data-op]', box).forEach(b => b.onclick = () => remoteOp(b.dataset.op));
    $$('[data-install]', box).forEach(b => b.onclick = () => remoteOp('install', b.dataset.install));
  }

  async function withProgress(label, ms) {
    const p = $('#opProg'); if (!p) return;
    $$('#remoteBody button').forEach(b => b.disabled = true);
    p.classList.remove('hidden'); $('#opText').textContent = label;
    const bar = p.querySelector('.bar span');
    bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth;
    bar.style.transition = `width ${ms}ms cubic-bezier(.4,.1,.3,1)`; bar.style.width = '100%';
    await sleep(ms + 100);
  }

  /* CCTV recorder (NVR): cameras on PoE ports, storage, footage export */
  function renderNvr(box, host, h, animate) {
    const diskCls = h.disk >= 90 ? 'crit' : h.disk >= 75 ? 'warn' : '';
    box.innerHTML = `
      <div class="host ${animate ? 'pop' : ''}">
        <div class="host-head"><div><span class="pulse-dot"></span><b class="mono">${host}</b> <span class="st ok">NVR</span></div><button class="btn xs ghost" id="disc">Disconnect</button></div>
        <div class="kv"><span>Device</span><b>${h.os}</b></div>
        <div class="kv"><span>IPv4</span><b class="mono">${h.ip}</b></div>
        <div class="kv"><span>Recording storage</span><b>${h.disk}%</b></div>
        <div class="meter ${diskCls}"><span style="width:${h.disk}%"></span></div>
        <h4>Live view</h4>
        <div class="feeds">${h.cams.map((c, i) => feedCanvas(host, i, 320, 180)).join('')}</div>
        <button class="btn sm" id="monOpen">Open monitor</button>
        <h4>Cameras</h4>
        ${h.cams.map((c, i) => `<div class="svc"><span>${esc(c.name)}<br><small class="mono muted">${c.ip} · PoE port ${c.port}</small></span>
          <span class="st ${c.status === 'Online' ? 'ok' : c.status === 'Booting' ? 'warn' : 'bad'}">${c.status === 'Online' ? 'Online' : c.status === 'Booting' ? 'Connecting…' : 'No signal'}</span>
          <button class="btn xs" data-poe="${i}">Power-cycle port</button></div>`).join('')}
        <h4>Footage</h4>
        <div class="ops"><button class="btn sm danger-o" data-op="export">Export footage…</button></div>
        <p class="muted" style="font-size:12px;margin:0">Footage of people is personal data under the PDPA.</p>
        <div class="progress hidden" id="opProg"><div class="bar"><span></span></div><small id="opText"></small></div>
      </div>`;
    $('#disc').onclick = () => { S.session = null; renderRemote(); termPrompt(); termPrint(['Session closed.']); };
    $$('[data-poe]', box).forEach(b => b.onclick = async () => {
      const c = h.cams[+b.dataset.poe];
      c.status = 'Booting'; renderRemote(); // the feed shows CONNECTING while the camera boots
      await withProgress(`Cutting PoE power to port ${c.port}, waiting for ${c.name} to boot…`, 2800);
      c.status = 'Online';
      act('poe', `Power-cycled PoE port ${c.port} (${c.name}) on ${host}`);
      toast(`${esc(c.name)} is back online`, 'good');
      beep('click'); if (S.session) renderRemote();
    });
    $('#monOpen', box).onclick = () => openMonitor(host);
    $$('.feed-tile', box).forEach(t => t.onclick = () => openMonitor(host, +t.dataset.cam));
    startFeeds();
    $('[data-op="export"]', box).onclick = async () => {
      await withProgress('Exporting yesterday 14:00–16:00, Pantry camera…', 2200);
      act('export', `Exported CCTV footage from ${host}`, { harmful: { key: 'footage', label: 'Exported CCTV footage without authorisation (PDPA)', pts: -80 } });
      beep('click'); if (S.session) renderRemote();
    };
  }

  /* ---------- CCTV live feeds (drawn on canvas, ~9 fps) ---------- */
  function feedCanvas(host, i, w, h) {
    return `<button class="feed-tile" data-cam="${i}" title="Open on monitor"><canvas class="feed" data-host="${host}" data-cam="${i}" width="${w}" height="${h}"></canvas></button>`;
  }

  let feedRAF = null, feedLast = 0;
  function startFeeds() { if (!feedRAF) feedRAF = requestAnimationFrame(feedTick); }
  function feedTick(now) {
    const cvs = $$('canvas.feed');
    if (!cvs.length) { feedRAF = null; return; } // nothing on screen: stop the loop
    if (now - feedLast > 110) {
      feedLast = now;
      cvs.forEach(cv => { if (cv.offsetParent !== null) drawFeed(cv, now / 1000); });
    }
    feedRAF = requestAnimationFrame(feedTick);
  }

  // simple greyscale scenes in a 320×180 coordinate space
  const SCENES = {
    lobby(g, t) {
      g.fillStyle = '#2b2b2b'; g.fillRect(0, 0, 320, 180);
      g.fillStyle = '#3b3b3b'; g.beginPath(); g.moveTo(0, 180); g.lineTo(60, 110); g.lineTo(260, 110); g.lineTo(320, 180); g.fill();
      g.strokeStyle = '#4a4a4a'; g.lineWidth = 1;
      for (let x = -200; x < 520; x += 40) { g.beginPath(); g.moveTo(160 + (x - 160) * .4, 110); g.lineTo(x, 180); g.stroke(); }
      g.fillStyle = '#1c1c1c'; g.fillRect(200, 38, 64, 72); // glass door
      g.strokeStyle = '#6a6a6a'; g.strokeRect(200, 38, 64, 72); g.beginPath(); g.moveTo(232, 38); g.lineTo(232, 110); g.stroke();
      g.fillStyle = '#555'; g.fillRect(40, 88, 110, 30); g.fillStyle = '#666'; g.fillRect(40, 84, 110, 6); // reception desk
      g.fillStyle = '#4d4d4d'; g.font = 'bold 13px Inter, sans-serif'; g.fillText('XYZ100', 70, 58);
      const walk = (off, speed, y, s) => {
        const x = ((t * speed + off) % 380) - 30;
        const leg = Math.sin(t * 8 + off) * 4 * s;
        g.fillStyle = '#0d0d0d';
        g.beginPath(); g.arc(x, y - 30 * s, 6 * s, 0, 7); g.fill();
        g.fillRect(x - 6 * s, y - 23 * s, 12 * s, 20 * s);
        g.fillRect(x - 5 * s + leg, y - 3 * s, 4 * s, 14 * s); g.fillRect(x + 1 * s - leg, y - 3 * s, 4 * s, 14 * s);
      };
      walk(0, 22, 140, 1.1); walk(190, 14, 122, .8);
    },
    pantry(g, t) {
      g.fillStyle = '#2e2e2e'; g.fillRect(0, 0, 320, 180);
      g.fillStyle = '#3a3a3a'; g.fillRect(0, 120, 320, 60);
      g.fillStyle = '#4b4b4b'; g.fillRect(20, 70, 190, 30); g.fillStyle = '#5c5c5c'; g.fillRect(20, 66, 190, 6); // counter
      g.fillStyle = '#222'; g.fillRect(40, 30, 60, 26); g.fillRect(120, 30, 60, 26); // cabinets
      g.fillStyle = '#5a5a5a'; g.fillRect(236, 26, 52, 98); g.fillStyle = '#444'; g.fillRect(236, 62, 52, 2); g.fillRect(280, 36, 3, 18); g.fillRect(280, 72, 3, 30); // fridge
      g.fillStyle = '#505050'; g.beginPath(); g.ellipse(120, 140, 56, 12, 0, 0, 7); g.fill(); // table
      g.fillStyle = '#ddd'; g.fillRect(110, 130, 7, 8); // mug
      // somebody keeps visiting the fridge
      const cyc = t % 16;
      if (cyc < 6) {
        const x = cyc < 1.5 ? 330 - cyc * 40 : cyc > 4.5 ? 270 + (cyc - 4.5) * 40 : 270;
        g.fillStyle = '#0d0d0d';
        g.beginPath(); g.arc(x, 66, 7, 0, 7); g.fill(); g.fillRect(x - 8, 74, 16, 30); g.fillRect(x - 7, 104, 6, 18); g.fillRect(x + 1, 104, 6, 18);
        if (cyc > 1.5 && cyc < 4.5) { g.fillStyle = '#5a5a5a'; g.fillRect(288, 26, 18, 98); } // fridge door open
      }
    },
    server(g, t) {
      g.fillStyle = '#161616'; g.fillRect(0, 0, 320, 180);
      g.fillStyle = '#202020'; g.fillRect(0, 150, 320, 30);
      for (let r = 0; r < 5; r++) {
        const x = 18 + r * 60;
        g.fillStyle = '#2d2d2d'; g.fillRect(x, 24, 44, 128);
        g.fillStyle = '#242424';
        for (let y = 30; y < 146; y += 10) g.fillRect(x + 4, y, 36, 7);
        for (let y = 30; y < 146; y += 10) {
          if (Math.sin(t * (3 + r) + y * .7 + r) > .2) { g.fillStyle = '#f0f0f0'; g.fillRect(x + 34, y + 2, 3, 3); }
        }
      }
    },
    carpark(g, t) {
      g.fillStyle = '#262626'; g.fillRect(0, 0, 320, 180);
      g.fillStyle = '#333'; g.beginPath(); g.moveTo(0, 180); g.lineTo(80, 70); g.lineTo(240, 70); g.lineTo(320, 180); g.fill();
      g.strokeStyle = '#8a8a8a'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(90 + i * 28, 75); g.lineTo(20 + i * 56, 175); g.stroke(); }
      g.fillStyle = '#3d3d3d'; g.fillRect(30, 20, 18, 150); g.fillRect(270, 20, 18, 150); // pillars
      const car = (x, y, w) => { g.fillStyle = '#141414'; g.fillRect(x, y, w, w * .45); g.fillStyle = '#4a4a4a'; g.fillRect(x + w * .15, y + 4, w * .7, w * .16); };
      car(70, 120, 60); car(180, 112, 54);
      const flick = Math.sin(t * 23) > .85 ? '#3a3a3a' : '#bdbdbd';
      g.fillStyle = flick; g.fillRect(120, 6, 80, 4); // flickering ceiling light
    }
  };
  const SCENE_ORDER = ['lobby', 'pantry', 'server', 'carpark'];

  function drawFeed(cv, t) {
    const h = S.world && S.world.hosts[cv.dataset.host]; if (!h) return;
    const i = +cv.dataset.cam, cam = h.cams[i]; if (!cam) return;
    const g = cv.getContext('2d'), k = cv.width / 320;
    g.save(); g.scale(k, k);
    if (cam.status === 'Online') {
      SCENES[cam.scene || SCENE_ORDER[i % 4]](g, t);
      for (let n = 0; n < 260; n++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .08})`; g.fillRect(Math.random() * 320, Math.random() * 180, 2, 2); }
    } else {
      for (let y = 0; y < 180; y += 4) for (let x = 0; x < 320; x += 4) {
        const v = cam.status === 'Booting' ? 10 + Math.random() * 25 : Math.random() * 200;
        g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 4, 4);
      }
      const label = cam.status === 'Booting' ? 'CONNECTING' + '.'.repeat(1 + Math.floor(t * 3) % 3) : 'NO SIGNAL';
      g.fillStyle = '#000'; g.fillRect(96, 74, 128, 32); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(96.5, 74.5, 127, 31);
      g.fillStyle = '#fff'; g.font = 'bold 13px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText(label, 160, 95); g.textAlign = 'left';
    }
    // scanlines + overlay text, like an NVR screen
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < 180; y += 3) g.fillRect(0, y, 320, 1);
    const sec = 8 * 3600 + 47 * 60 + S.elapsed; // shift clock starts at 08:47
    const hh = String(Math.floor(sec / 3600) % 24).padStart(2, '0'), mm = String(Math.floor(sec / 60) % 60).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');
    g.font = '9px "JetBrains Mono", monospace';
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(4, 4, g.measureText(cam.id).width + 8, 13); g.fillRect(222, 4, 94, 13);
    g.fillStyle = '#fff'; g.fillText(cam.id, 8, 14); g.fillText(`MON ${hh}:${mm}:${ss}`, 228, 14);
    if (cam.status === 'Online' && Math.floor(t * 1.5) % 2) { g.beginPath(); g.arc(12, 168, 3, 0, 7); g.fill(); g.fillText('REC', 18, 171); }
    g.restore();
  }

  function openMonitor(host, only) {
    const h = S.world.hosts[host];
    const grid = $('#monGrid');
    grid.className = 'mon-grid' + (only !== undefined ? ' single' : '');
    grid.innerHTML = h.cams.map((c, i) => (only === undefined || only === i)
      ? `<button class="mon-tile" data-cam="${i}">${feedCanvas(host, i, 640, 360).replace(/<\/?button[^>]*>/g, '')}<span>${esc(c.name)}</span></button>` : '').join('');
    $('#monHost').textContent = `${host} · ${h.cams.length} cameras`;
    $$('.mon-tile', grid).forEach(t => t.onclick = () => openMonitor(host, only === undefined ? +t.dataset.cam : undefined));
    showModal('#cctvModal'); beep('click');
    if (activeTicket()) act('monitor', `Checked the live CCTV monitor on ${host}`);
    startFeeds();
  }
  function closeMonitor() { hideModal('#cctvModal'); $('#monGrid').innerHTML = ''; }

  function camByName(name) {
    for (const h of Object.values(S.world ? S.world.hosts : {})) {
      if (h.type !== 'nvr') continue;
      const c = h.cams.find(c => c.id.toLowerCase() === name);
      if (c) return c;
    }
    return null;
  }

  async function remoteOp(op, arg) {
    const host = S.session.host, h = S.world.hosts[host], owner = h.owner;
    if (op === 'spooler') {
      await withProgress('Restarting Print Spooler…', 1600);
      h.spooler = 'Running'; h.queue = 0;
      act('spooler', `Restarted Print Spooler on ${host}`, { user: owner });
      toast('Print Spooler restarted, queue cleared', 'good', '🖨️');
    } else if (op === 'outlook') {
      await withProgress('Rebuilding Outlook profile…', 2200);
      h.outlook = 'Healthy';
      act('outlook', `Rebuilt Outlook profile on ${host}`, { user: owner });
      toast('Outlook profile rebuilt', 'good', '📧');
    } else if (op === 'cleanup') {
      await withProgress('Removing temp files & update cache…', 2400);
      const before = h.disk; h.disk = Math.min(h.disk, Math.max(45, h.disk - 37));
      act('cleanup', `Ran Disk Cleanup on ${host} (${before}% → ${h.disk}%)`, { user: owner });
      toast(`Freed space: ${before}% → ${h.disk}%`, 'good', '🧹');
    } else if (op === 'reboot') {
      await withProgress('Restarting computer…', 3000);
      act('reboot', `Restarted ${host}`, { user: owner });
      toast(`${host} restarted`, 'info', '🔁');
    } else if (op === 'install') {
      const s = window.SOFTWARE.find(x => x.name === arg);
      await withProgress(`Installing ${arg}…`, 2200);
      h.software.push(arg);
      act('install', `Installed ${arg} on ${host}`, {
        user: owner,
        harmful: s.policy === 'license' ? { key: 'lic-' + arg, label: `Installed ${arg} without a license approval`, pts: -60 }
          : s.policy === 'blocked' ? { key: 'blk-' + arg, label: `Installed blocked software (${arg})`, pts: -120 } : null
      });
      if (s.policy === 'approved') toast(`${arg} installed`, 'good', '📦');
    }
    beep('click');
    if (S.session) renderRemote();
  }

  /* ------------------------------ terminal ----------------------------- */
  const term = { hist: [], hi: 0, busy: false };
  const LOCAL = 'HELPDESK-01';

  function termReset() {
    $('#termOut').innerHTML = '';
    termPrint([`IT Support Journey Remote Shell [Version 2.4]`, `Type "help" for available commands.`, ''], 'muted');
    termPrompt();
  }
  function termPrompt() {
    $('#termPrompt').textContent = (S.session ? S.session.host + (S.session.guided ? '(guided)' : '') : LOCAL) + '>';
  }
  function termPrint(lines, cls = '') {
    const out = $('#termOut');
    lines.forEach(l => { const d = document.createElement('div'); d.className = cls; d.textContent = l; out.appendChild(d); });
    out.scrollTop = out.scrollHeight;
  }
  async function termSlow(lines, cls = '', delay = 380) {
    for (const l of lines) { termPrint([l], cls); await sleep(delay); }
  }

  function curHost() { return S.session ? S.world.hosts[S.session.host] : null; }

  function resolveName(name) {
    const h = curHost();
    name = name.toLowerCase();
    if (name === 'portal.' + D) return h && h.dnsStale ? '10.12.0.99' : '10.12.0.20';
    if (name === 'mail.' + D) return '10.12.0.25';
    if (name === 'fs01.' + D || name === 'fs01') return '10.12.0.30';
    if (name === 'google.com') return '142.250.4.100';
    const cam = camByName(name.replace('.' + D, ''));
    if (cam) return cam.ip;
    if (name === 'nvr-l12' || name === 'nvr-l12.' + D) return '10.12.20.10';
    if (name === 'mymy.gov.my' || name === 'mytax.hasil.gov.my') return '203.115.200.10';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) return name;
    return null;
  }

  /* ---------- PowerShell-style admin commands (AD + Exchange Online) ---------- */
  const SWITCHES = new Set(['reset', 'archive', 'confirm', 'add', 'nochangeatlogon', 'force']);
  function parseArgs(line) {
    const toks = [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(m => m[1] ?? m[2] ?? m[3]);
    toks.shift(); // the cmdlet itself
    const pos = [], named = {};
    for (let i = 0; i < toks.length; i++) {
      const m = /^-([A-Za-z]+)(?::(.*))?$/.exec(toks[i]);
      if (!m) { pos.push(toks[i]); continue; }
      const key = m[1].toLowerCase();
      if (m[2] !== undefined) named[key] = m[2];
      else if (SWITCHES.has(key) || i + 1 >= toks.length || /^-[A-Za-z]/.test(toks[i + 1])) named[key] = true;
      else named[key] = toks[++i];
    }
    return { pos, named };
  }
  // accepts username, DOMAIN\username, email address or staff ID
  function findUser(x) {
    if (!x || x === true) return null;
    // "arjun:\Calendar", "arjun:Calendar" and "arjun:/Calendar" all mean arjun's calendar
    const v = String(x).toLowerCase().replace(/:[\\/]?calendar$/, '').replace(/^.*\\/, '');
    const W = S.world.users, local = v.split('@')[0];
    if (W[v]) return v;
    if (v.includes('@') && W[local]) return local;
    return Object.keys(W).find(k => W[k].empId.toLowerCase() === v) || null;
  }
  const findIn = (obj, x) => { const v = String(x || '').toLowerCase().split('@')[0]; return obj[v] ? v : null; };
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const TF = b => (b ? 'True' : 'False');
  const ps = r => { termPrint([r.msg], r.ok ? 'ok' : 'bad'); };

  function needUser(v) { const k = findUser(v); if (!k) throw new Error(`Cannot find an object with identity: '${v === true || !v ? '' : v}'.`); return k; }
  function needShared(v) { const k = findIn(S.world.mail.shared, v); if (!k) throw new Error(`The operation couldn't be performed because object '${v || ''}' couldn't be found (shared mailboxes: ${Object.keys(S.world.mail.shared).join(', ')}).`); return k; }
  function needList(v) { const k = findIn(S.world.mail.dls, v); if (!k) throw new Error(`Couldn't find distribution group '${v || ''}' (lists: ${Object.keys(S.world.mail.dls).join(', ')}).`); return k; }
  function needGroup(v) { const g = window.GROUPS.find(x => x.toLowerCase() === String(v || '').toLowerCase()); if (!g) throw new Error(`Cannot find an object with identity: '${v || ''}'. Groups: ${window.GROUPS.join(', ')}.`); return g; }
  const idOf = p => p.named.identity || p.named.mailbox || p.pos[0];

  const ADMIN = {
    /* Active Directory */
    'get-aduser'(p) {
      if (p.named.filter) {
        const f = String(p.named.filter).toLowerCase().replace(/name\s+-like\s+/, '').replace(/[*'"{}]/g, '').trim();
        const rows = Object.entries(S.world.users).filter(([k, u]) => !f || (k + ' ' + u.name + ' ' + u.empId).toLowerCase().includes(f));
        termPrint([pad('SamAccountName', 11) + ' ' + pad('Name', 27) + ' ' + pad('EmployeeID', 10) + ' Enabled LockedOut', '-'.repeat(68),
          ...rows.map(([k, u]) => pad(k, 11) + ' ' + pad(u.name, 27) + ' ' + pad(u.empId, 10) + ' ' + pad(TF(u.enabled), 7) + ' ' + TF(u.locked))]);
        return;
      }
      const k = needUser(idOf(p)), u = S.world.users[k];
      termPrint([
        `DistinguishedName : CN=${u.name},OU=${u.dept},DC=${D.split('.')[0]},DC=local`,
        `Name              : ${u.name}`, `SamAccountName    : ${k}`, `EmployeeID        : ${u.empId}`,
        `Title             : ${u.title}`, `Department        : ${u.dept}`,
        `Enabled           : ${TF(u.enabled)}`, `LockedOut         : ${TF(u.locked)}`,
        `PasswordExpired   : ${TF(u.pwdExpired)}`, `MFA               : ${u.mfa}`
      ]);
    },
    'unlock-adaccount': p => ps(OPS.unlock(needUser(idOf(p)))),
    'enable-adaccount': p => ps(OPS.setEnabled(needUser(idOf(p)), true)),
    'disable-adaccount': p => ps(OPS.setEnabled(needUser(idOf(p)), false)),
    'set-adaccountpassword'(p) {
      if (!p.named.reset) throw new Error('Use -Reset to set a new temporary password.');
      ps(OPS.resetPwd(needUser(idOf(p)), !p.named.nochangeatlogon));
    },
    'get-adprincipalgroupmembership'(p) {
      const k = needUser(idOf(p));
      termPrint(['name', '----', ...(S.world.users[k].groups.length ? S.world.users[k].groups : ['(none)'])]);
    },
    'add-adgroupmember': p => ps(OPS.addGroup(needUser(p.named.members || p.pos[1]), needGroup(p.named.identity || p.pos[0]))),
    'remove-adgroupmember': p => ps(OPS.removeGroup(needUser(p.named.members || p.pos[1]), needGroup(p.named.identity || p.pos[0]))),
    'reset-mfa': p => ps(OPS.resetMfa(needUser(idOf(p)))),

    /* Exchange Online */
    'get-mailbox'(p) {
      const k = needUser(idOf(p)), b = S.world.mail.boxes[k];
      termPrint([
        `Name                  : ${uname(k)}`, `PrimarySmtpAddress    : ${mailAddr(k)}`,
        `Licensed              : ${TF(b.licensed)}`, `ArchiveStatus         : ${b.archive ? 'Active' : 'None'}`,
        `ForwardingSmtpAddress : ${b.forward || ''}`, `AutoReplyState        : ${b.autoReply ? 'Enabled' : 'Disabled'}`
      ], b.forward ? 'warn' : '');
    },
    'get-mailboxstatistics'(p) {
      const k = needUser(idOf(p)), b = S.world.mail.boxes[k];
      if (!b.licensed) throw new Error(`${uname(k)} has no mailbox.`);
      termPrint([`DisplayName   : ${uname(k)}`, `TotalItemSize : ${b.size.toFixed(1)} GB`, `Quota         : ${b.quota} GB (${Math.round(b.size / b.quota * 100)}% used)`], b.size / b.quota >= .9 ? 'warn' : '');
    },
    'enable-mailbox'(p) {
      if (!p.named.archive) throw new Error('Use -Archive to enable the online archive.');
      ps(OPS.archive(needUser(idOf(p))));
    },
    'set-mguserlicense': p => ps(OPS.licence(needUser(p.named.userid || idOf(p)))),
    'get-inboxrule'(p) {
      const k = needUser(p.named.mailbox || p.pos[0]), rules = S.world.mail.boxes[k].rules;
      termPrint(rules.length ? [pad('Name', 10) + ' Description', '-'.repeat(60), ...rules.map(r => pad(`"${r.name}"`, 10) + ` If ${r.cond}, ${r.action}`)] : ['(no inbox rules)'], rules.length ? 'warn' : '');
    },
    'remove-inboxrule': p => ps(OPS.ruleRemove(needUser(p.named.mailbox || p.pos[0]), String(p.named.identity || p.pos[1] || ''))),
    'set-mailbox'(p) {
      const k = needUser(idOf(p));
      if ('forwardingsmtpaddress' in p.named) {
        if (String(p.named.forwardingsmtpaddress).toLowerCase() !== '$null') throw new Error('In this simulator forwarding can only be cleared: -ForwardingSmtpAddress $null');
        return ps(OPS.forwardOff(k));
      }
      throw new Error('Supported here: Set-Mailbox <user> -ForwardingSmtpAddress $null');
    },
    'set-mailboxautoreplyconfiguration'(p) {
      const k = needUser(idOf(p)), state = String(p.named.autoreplystate || '').toLowerCase();
      if (state === 'enabled') return ps(OPS.autoReply(k, String(p.named.internalmessage || p.named.externalmessage || 'Out of office.')));
      if (state === 'disabled') return ps(OPS.autoReply(k, null));
      throw new Error('Use -AutoReplyState Enabled -InternalMessage "..."  or  -AutoReplyState Disabled');
    },
    'get-mailboxfolderpermission'(p) {
      const k = needUser(idOf(p)), cal = S.world.mail.boxes[k].cal;
      termPrint([pad('User', 28) + ' AccessRights', '-'.repeat(42), pad('Owner', 28) + ' Owner', ...cal.map(c => pad(uname(c.u), 28) + ' ' + c.role)]);
    },
    'add-mailboxfolderpermission'(p) {
      const role = String(p.named.accessrights || '');
      ps(OPS.calAdd(needUser(idOf(p)), needUser(p.named.user), role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()));
    },
    'remove-mailboxfolderpermission': p => ps(OPS.calRemove(needUser(idOf(p)), needUser(p.named.user))),
    'get-mailboxpermission'(p) {
      const box = needShared(idOf(p)), g = S.world.mail.shared[box];
      termPrint([pad('User', 28) + ' AccessRights', '-'.repeat(42), ...g.full.map(k => pad(uname(k), 28) + ' FullAccess'), ...g.sendAs.map(k => pad(uname(k), 28) + ' SendAs')]);
    },
    'add-mailboxpermission'(p) {
      if (String(p.named.accessrights || '').toLowerCase() !== 'fullaccess') throw new Error('Use -AccessRights FullAccess (Send As is Add-RecipientPermission).');
      ps(OPS.sharedAdd(needShared(idOf(p)), needUser(p.named.user), 'Full Access'));
    },
    'remove-mailboxpermission': p => ps(OPS.sharedRemove(needShared(idOf(p)), needUser(p.named.user), 'Full Access')),
    'add-recipientpermission'(p) {
      if (String(p.named.accessrights || '').toLowerCase() !== 'sendas') throw new Error('Use -AccessRights SendAs.');
      ps(OPS.sharedAdd(needShared(idOf(p)), needUser(p.named.trustee), 'Send As'));
    },
    'remove-recipientpermission': p => ps(OPS.sharedRemove(needShared(idOf(p)), needUser(p.named.trustee), 'Send As')),
    'get-distributiongroupmember'(p) {
      const l = needList(idOf(p)), g = S.world.mail.dls[l];
      termPrint(g.dynamic ? ['(dynamic list: every enabled staff account)'] : ['Name', '----', ...(g.members.length ? g.members.map(uname) : ['(no members)'])]);
    },
    'add-distributiongroupmember': p => ps(OPS.dlAdd(needList(idOf(p)), needUser(p.named.member || p.pos[1]))),
    'remove-distributiongroupmember': p => ps(OPS.dlRemove(needList(idOf(p)), needUser(p.named.member || p.pos[1]))),
    'get-messagetrace'(p) {
      const sender = p.named.senderaddress, recip = p.named.recipientaddress;
      if (!sender && !recip) throw new Error('Use -SenderAddress <address> or -RecipientAddress <address>.');
      const side = (x, v) => { const k = findUser(v); return k ? x === k : mailAddr(x).toLowerCase().includes(String(v).toLowerCase()); };
      const res = OPS.trace(sender || recip).filter(e => (!sender || side(e.from, sender)) && (!recip || side(e.to, recip)));
      if (!res.length) { termPrint(['(no messages found in the last 48 hours)']); return; }
      res.forEach(e => {
        termPrint([`${pad(e.time, 15)} ${pad(e.status, 11)} ${e.subject}`, `    ${mailAddr(e.from)} -> ${mailAddr(e.to)}`], e.status === 'Delivered' ? '' : 'warn');
        termPrint([`    ${e.detail}`], 'muted');
      });
      act('trace', `Ran Get-MessageTrace for ${sender || recip}`);
    },
    'get-quarantinemessage'(p) {
      const Q = S.world.mail.quarantine;
      if (p.named.identity) {
        const q = Q.find(x => x.id === p.named.identity); if (!q) throw new Error(`No quarantined message with identity ${p.named.identity}.`);
        termPrint([`Identity  : ${q.id}`, `Subject   : ${q.subject}`, `Sender    : ${q.from}`, `Recipient : ${mailAddr(q.to)}`, `Type      : ${q.reason}`, `State     : ${q.state}`, `Details   : ${q.detail}`]);
        return;
      }
      const held = Q.filter(q => q.state === 'held');
      termPrint(held.length ? [pad('Identity', 11) + ' ' + pad('Type', 26) + ' Subject', '-'.repeat(70), ...held.map(q => pad(q.id, 11) + ' ' + pad(q.reason, 26) + ' ' + q.subject)] : ['(quarantine is empty)']);
    },
    'release-quarantinemessage': p => ps(OPS.qRelease(String(p.named.identity || p.pos[0] || ''))),
    'delete-quarantinemessage': p => ps(OPS.qDelete(String(p.named.identity || p.pos[0] || '')))
  };

  const ADMIN_HELP = {
    ad: [
      'Active Directory',
      '  Get-ADUser <user>                     account status',
      '  Get-ADUser -Filter <text>             search by name or staff ID',
      '  Unlock-ADAccount <user>',
      '  Enable-ADAccount <user> / Disable-ADAccount <user>',
      '  Set-ADAccountPassword <user> -Reset   temp password, must change at logon',
      '  Get-ADPrincipalGroupMembership <user>',
      '  Add-ADGroupMember <group> <user>      quote names with spaces: "Domain Admins"',
      '  Remove-ADGroupMember <group> <user>',
      '  Reset-MFA <user>                      (simulator shortcut)',
      '<user> can be a username, email or staff ID, e.g. naisyah or XYZ20417'
    ],
    mail: [
      'Exchange Online',
      '  Get-Mailbox <user> / Get-MailboxStatistics <user>',
      '  Enable-Mailbox <user> -Archive',
      '  Set-MgUserLicense <user> -Add',
      '  Get-InboxRule -Mailbox <user>',
      '  Remove-InboxRule -Mailbox <user> -Identity "<rule name>"',
      '  Set-Mailbox <user> -ForwardingSmtpAddress $null',
      '  Set-MailboxAutoReplyConfiguration <user> -AutoReplyState Enabled -InternalMessage "..."',
      '  Get-/Add-/Remove-MailboxFolderPermission <owner>:\\Calendar -User <user> -AccessRights Editor',
      '  Get-MailboxPermission <shared>',
      '  Add-/Remove-MailboxPermission <shared> -User <user> -AccessRights FullAccess',
      '  Add-/Remove-RecipientPermission <shared> -Trustee <user> -AccessRights SendAs',
      '  Get-/Add-/Remove-DistributionGroupMember <list> -Member <user>',
      '  Get-MessageTrace -SenderAddress <x> | -RecipientAddress <x>',
      '  Get-QuarantineMessage [-Identity <id>]',
      '  Release-QuarantineMessage -Identity <id> / Delete-QuarantineMessage -Identity <id>'
    ]
  };

  async function runAdmin(cmd, line) {
    const fn = ADMIN[cmd];
    await sleep(250);
    try { await fn(parseArgs(line)); }
    catch (e) { termPrint([`${line.split(/\s+/)[0]} : ${e.message}`], 'bad'); }
    renderDirectory(); renderMail();
  }

  async function runCmd(raw) {
    const line = raw.trim();
    termPrint([$('#termPrompt').textContent + ' ' + line], 'cmd');
    if (!line) return;
    term.hist.push(line); term.hi = term.hist.length;
    const [c0, ...args] = line.split(/\s+/);
    const c = c0.toLowerCase();
    const a = args.join(' ').toLowerCase();
    const h = curHost();
    const where = S.session ? S.session.host : LOCAL;
    const user = h ? h.owner : null;

    if (c === 'help' && (a === 'ad' || a === 'mail')) { termPrint(ADMIN_HELP[a], 'muted'); return; }
    if (Object.prototype.hasOwnProperty.call(ADMIN, c)) { await runAdmin(c, line); return; }

    switch (c) {
      case 'help':
        termPrint([
          'connect <host>        open a remote session',
          'disconnect            close the session',
          'hostname | whoami     identify the machine/user',
          'ipconfig [/all]       show IP configuration',
          'ipconfig /release     release DHCP lease',
          'ipconfig /renew       renew DHCP lease',
          'ipconfig /displaydns  show DNS cache',
          'ipconfig /flushdns    clear DNS cache',
          'ping <host>           test connectivity',
          'nslookup <name>       query the DNS server',
          'net stop|start spooler  control Print Spooler',
          'sc query spooler      service status',
          'systeminfo            OS & disk info',
          'gpupdate /force       refresh group policy',
          'cls                   clear screen',
          '',
          'help ad               Active Directory commands (Get-ADUser, Unlock-ADAccount, …)',
          'help mail             Exchange Online commands (Get-Mailbox, Get-InboxRule, …)'
        ], 'muted'); break;
      case 'cls': case 'clear': $('#termOut').innerHTML = ''; break;
      case 'connect': if (!args[0]) termPrint(['Usage: connect <hostname>'], 'warn'); else { termPrint(['Connecting…'], 'muted'); await sleep(700); if (!connect(args[0])) termPrint([`Host ${args[0]} not found.`], 'bad'); } break;
      case 'disconnect': case 'exit': if (S.session) { S.session = null; renderRemote(); termPrompt(); termPrint(['Session closed.']); } else termPrint(['No active session.'], 'muted'); break;
      case 'hostname': termPrint([where]); break;
      case 'whoami': termPrint([`${D.split('.')[0]}\\${user || 'helpdesk'}`]); break;
      case 'ipconfig': {
        if (a === '/release') {
          if (!h) { termPrint(['That would release the help desk PC\'s own lease. Connect to a user host first.'], 'warn'); break; }
          await termSlow(['Releasing DHCP lease…'], 'muted', 600);
          h.released = true;
          act('release', `ipconfig /release on ${where}`, { user });
          termPrint(['Ethernet adapter Ethernet: IPv4 address released.']);
        } else if (a === '/renew') {
          if (!h) { termPrint(['Renewed lease for HELPDESK-01 (10.12.1.50).']); break; }
          await termSlow(['Contacting DHCP server…', 'Waiting for offer…'], 'muted', 700);
          h.apipa = false; h.released = false;
          if (S.session) S.session.guided = false;
          act('renew', `ipconfig /renew on ${where}`, { user });
          termPrint([`IPv4 Address. . . . : ${h.ip}`, 'Subnet Mask . . . . : 255.255.255.0', `Default Gateway . . : ${h.ip.replace(/\.\d+$/, '.1')}`], 'ok');
          termPrompt(); renderRemote();
        } else if (a === '/flushdns') {
          if (h) { h.dnsStale = false; act('flushdns', `ipconfig /flushdns on ${where}`, { user }); }
          termPrint(['Successfully flushed the DNS Resolver Cache.'], 'ok');
        } else if (a === '/displaydns') {
          termPrint([
            'Windows IP Configuration', '',
            `    portal.${D}`, '    ----------------------------------------',
            `    Record Type . . . : 1`, `    Time To Live  . . : 81244`,
            `    A (Host) Record . : ${h && h.dnsStale ? '10.12.0.99' : '10.12.0.20'}`, '',
            `    mail.${D}`, `    A (Host) Record . : 10.12.0.25`
          ]);
        } else {
          const ip = h ? (h.released ? '0.0.0.0' : h.apipa ? '169.254.88.12' : h.ip) : '10.12.1.50';
          const gw = h && (h.apipa || h.released) ? '' : ip.replace(/\.\d+$/, '.1');
          termPrint(['Windows IP Configuration', '', 'Ethernet adapter Ethernet:', `   IPv4 Address. . . . . . . : ${ip}`, `   Subnet Mask . . . . . . . : ${h && h.apipa ? '255.255.0.0' : '255.255.255.0'}`, `   Default Gateway . . . . . : ${gw}`,
            ...(a === '/all' ? [`   DHCP Enabled. . . . . . . : Yes`, `   DNS Servers . . . . . . . : 10.12.0.53`, `   Host Name . . . . . . . . : ${where}`] : [])], h && h.apipa ? 'warn' : '');
        }
        break;
      }
      case 'ping': {
        if (!args[0]) { termPrint(['Usage: ping <host>'], 'warn'); break; }
        const name = args[0].toLowerCase();
        const ip = resolveName(name);
        if (h && (h.apipa || h.released)) { await termSlow(['PING: transmit failed. General failure.', 'PING: transmit failed. General failure.', 'PING: transmit failed. General failure.'], 'bad'); break; }
        if (!ip) { termPrint([`Ping request could not find host ${name}. Please check the name and try again.`], 'bad'); break; }
        const camHit = camByName(name.replace('.' + D, ''));
        const down = (name.startsWith('mail') && S.world && S.world.outage) || ip === '10.12.0.99' || (camHit && camHit.status !== 'Online');
        termPrint([`Pinging ${name} [${ip}] with 32 bytes of data:`]);
        for (let i = 0; i < 4; i++) {
          await sleep(450);
          termPrint([down ? 'Request timed out.' : `Reply from ${ip}: bytes=32 time=${Math.floor(rand(1, ip.startsWith('10.') ? 4 : 18))}ms TTL=${ip.startsWith('10.') ? 128 : 117}`], down ? 'bad' : '');
        }
        termPrint([`Packets: Sent = 4, Received = ${down ? 0 : 4}, Lost = ${down ? '4 (100% loss)' : '0 (0% loss)'}`], down ? 'bad' : 'ok');
        break;
      }
      case 'nslookup': {
        if (!args[0]) { termPrint(['Usage: nslookup <name>'], 'warn'); break; }
        const name = args[0].toLowerCase();
        let ip = resolveName(name);
        if (name.startsWith('portal')) ip = '10.12.0.20'; // the DNS server always knows the truth
        await sleep(400);
        termPrint([`Server:  dc01.${D}`, 'Address:  10.12.0.53', '']);
        termPrint(ip ? [`Name:    ${name}`, `Address:  ${ip}`] : [`*** dc01.${D} can't find ${name}: Non-existent domain`], ip ? '' : 'bad');
        break;
      }
      case 'net': {
        const [verb, svc] = args.map(x => x.toLowerCase());
        if (svc !== 'spooler' || !['stop', 'start'].includes(verb)) { termPrint(['Usage: net stop spooler | net start spooler'], 'warn'); break; }
        if (!h) { termPrint(['Connect to the user\'s computer first.'], 'warn'); break; }
        if (verb === 'stop') {
          await termSlow(['The Print Spooler service is stopping.', 'The Print Spooler service was stopped successfully.'], '', 600);
          h.spooler = 'Stopped'; h.queue = 0;
          act('spoolerStop', `net stop spooler on ${where}`, { user });
        } else {
          await termSlow(h.spooler === 'Stuck' ? ['The Print Spooler service is starting.'] : ['The Print Spooler service is starting.', 'The Print Spooler service was started successfully.'], 'ok', 600);
          act('spoolerStart', `net start spooler on ${where}`, { user });
          if (h.spooler === 'Stuck') termPrint(['System error 1056: An instance of the service is already running (hung). Stop it first.'], 'warn');
          else h.spooler = 'Running';
        }
        renderRemote();
        break;
      }
      case 'sc': termPrint(h ? ['SERVICE_NAME: Spooler', `        STATE              : ${h.spooler === 'Running' ? '4  RUNNING' : h.spooler === 'Stopped' ? '1  STOPPED' : '4  RUNNING (NOT RESPONDING)'}`, `        JOBS IN QUEUE      : ${h.queue}`] : ['SERVICE_NAME: Spooler', '        STATE              : 4  RUNNING']); break;
      case 'systeminfo': await termSlow(['Loading…'], 'muted', 500); termPrint([`Host Name:      ${where}`, `OS Name:        ${h ? h.os : 'Windows 11 Enterprise'}`, `Domain:         ${D}`, `Time Zone:      (UTC+08:00) Kuala Lumpur, Singapore`, `Disk C: used:   ${h ? h.disk : 41}%`]); break;
      case 'gpupdate': await termSlow(['Updating policy…', '', 'Computer Policy update has completed successfully.', 'User Policy update has completed successfully.'], '', 500); if (h) act('gpupdate', `gpupdate /force on ${where}`, { user }); break;
      case 'shutdown': if (h) { termPrint(['Use the Restart PC button in Remote.'], 'muted'); } else termPrint(['That would restart your own PC. Connect to a user host first.'], 'warn'); break;
      default: termPrint([`'${c0}' is not recognized as an internal or external command. Type "help".`], 'bad');
    }
  }

  /* ------------------------------ close / grading ---------------------- */
  let closing = null;
  function openClose(t) {
    closing = t;
    S.paused = true;
    $('#closeId').textContent = `${t.id} · ${t.sc.title}`;
    $('#closeNote').value = '';
    $('#escTeam').innerHTML = window.TEAMS.map(x => `<option>${x}</option>`).join('');
    showModal('#closeModal');
    setTimeout(() => $('#closeNote').focus(), 200);
  }

  function grade(t, action, team, note) {
    const sc = t.sc, lines = [];
    let correct = false;
    if (action === 'resolve') {
      if (sc.escalate) lines.push([`Should have been escalated to ${sc.escalate}`, -60]);
      else if (sc.check(S.world)) { correct = true; lines.push(['Issue fixed', 100]); }
      else lines.push(['Closed without fixing — user reopened the ticket', -50]);
    } else {
      if (sc.escalate === team) { correct = true; lines.push([`Correct escalation to ${team}`, 100]); }
      else if (sc.escalate) lines.push([`Wrong team — this belongs to ${sc.escalate}`, -30]);
      else lines.push([`${team} bounced it back: this is an L1 fix`, -40]);
    }
    if (correct) {
      const rel = (sc.relevant || []).filter(k => t.asked.has(k)).length;
      if (rel) lines.push([`Asked the right questions (${rel})`, rel * 5]);
      if (timed() && !t.breached) { const b = Math.round(30 * t.slaLeft / t.slaTotal); if (b > 0) lines.push(['Speed bonus', b]); }
      if (action === 'resolve' && t.asked.has('retry')) lines.push(['Confirmed the fix with the user', 10]);
    }
    if (note.trim().length >= 20) lines.push(['Clear resolution notes', 10]);
    else lines.push(['Missing / thin ticket notes', -5]);
    if (t.breached) lines.push(['SLA breached', -25]);
    if (t.hints && S.mode === 'standard') lines.push([`Hints used (${t.hints})`, -10 * t.hints]);
    t.flags.forEach(f => lines.push([f.label, f.pts]));
    let pts = lines.reduce((s, l) => s + l[1], 0);
    if (expert() && pts > 0) { const bonus = Math.round(pts * 0.25); lines.push(['Expert mode bonus (+25%)', bonus]); pts += bonus; }
    let stars = correct ? 5 : 1;
    if (correct) { if (t.breached) stars--; stars -= Math.min(2, t.flags.length); if (!t.asked.size) stars--; }
    stars = Math.max(1, Math.min(5, stars));
    return { correct, lines, pts, stars };
  }

  function closeTicket(action) {
    const t = closing; if (!t) return;
    const team = $('#escTeam').value, note = $('#closeNote').value;
    const r = grade(t, action, team, note);
    t.status = 'closed';
    S.closed++; if (r.correct) S.correct++;
    S.score += r.pts; S.csat.push(r.stars);
    const before = levelOf(S.xp);
    const gain = Math.max(0, r.pts);
    S.xp += gain; S.xpGained += gain;
    store.set('xp', S.xp);
    hideModal('#closeModal');
    if (S.session && S.world.hosts[S.session.host] && S.world.hosts[S.session.host].owner === t.sc.user) { S.session = null; renderRemote(); termPrompt(); }
    S.activeId = null;
    const nextOpen = S.tickets.find(x => x.status === 'open');
    showResult(t, r, levelOf(S.xp) > before);
    renderQueue(); renderHUD(); bump('#score');
    if (nextOpen) openTicket(nextOpen.id); else renderTicket();
  }

  function showResult(t, r, leveled) {
    const m = $('#resultModal');
    $('#resIco').textContent = r.correct ? 'Correct' : 'Incorrect';
    $('#resTitle').textContent = r.correct ? 'Ticket handled correctly' : 'Ticket handled incorrectly';
    $('#resStars').innerHTML = [1, 2, 3, 4, 5].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${.3 + i * .12}s">★</span>`).join('');
    $('#resLines').innerHTML = r.lines.map((l, i) => `<div class="line" style="animation-delay:${.2 + i * .12}s"><span>${esc(l[0])}</span><b class="${l[1] >= 0 ? 'pos' : 'neg'}">${l[1] >= 0 ? '+' : ''}${l[1]}</b></div>`).join('');
    $('#resLesson').innerHTML = `<b>Lesson</b><p>${esc(t.sc.lesson)}</p>`;
    const rv = t.sc.reveal;
    $('#resReveal').innerHTML = rv ? `<div class="reveal-card">${avatar(rv.key, rv.name, 'lg')}<div><small>Behind this ticket</small><b>${esc(rv.name)}</b><p>${esc(rv.text)}</p></div></div>` : '';
    $('#resTotal').textContent = '0';
    m.querySelector('.modal-card').className = 'modal-card result ' + (r.correct ? 'win' : 'lose');
    showModal('#resultModal');
    countUp($('#resTotal'), r.pts, 900);
    if (r.correct) { beep('good'); confetti(r.stars >= 5 ? 160 : 70); } else beep('bad');
    const rect = $('#score').getBoundingClientRect();
    floatText((r.pts >= 0 ? '+' : '') + r.pts, rect.left, rect.bottom, r.pts >= 0 ? 'pos' : 'neg');
    S.pendingLevel = leveled;
  }

  function countUp(el, to, ms) {
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / ms);
      el.textContent = (to >= 0 ? '+' : '') + Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function afterResult() {
    hideModal('#resultModal');
    if (S.pendingLevel) {
      S.pendingLevel = false;
      const li = levelOf(S.xp);
      $('#lvlName').textContent = LEVELS[li].name;
      $('#lvlNum').textContent = li + 1;
      showModal('#levelModal'); beep('level'); confetti(220);
      return;
    }
    resumeOrEnd();
  }

  function resumeOrEnd() {
    if (S.closed >= SHIFT_SIZE) return endShift();
    S.paused = false;
    if (!S.tickets.some(t => t.status === 'open') && S.deck.length) spawn();
  }

  function endShift() {
    S.running = false; S.paused = true; clearInterval(S.timer);
    const avg = S.csat.reduce((a, b) => a + b, 0) / S.csat.length;
    const ratio = S.correct / SHIFT_SIZE;
    const grade = ratio === 1 && avg >= 4.5 ? 'S' : ratio >= .85 ? 'A' : ratio >= .7 ? 'B' : ratio >= .5 ? 'C' : 'D';
    const newBest = S.score > S.best;
    if (newBest) { S.best = S.score; store.set('best', S.best); }
    $('#endGrade').textContent = grade;
    $('#endGrade').className = 'grade g-' + grade;
    $('#endStats').innerHTML = [
      ['Score', S.score + (newBest ? ' (new best)' : '')], ['Correct', `${S.correct}/${SHIFT_SIZE}`],
      ['Avg CSAT', avg.toFixed(1) + '★'], ['Shift time', fmt(S.elapsed)],
      ['XP earned', '+' + S.xpGained], ['Best score', S.best]
    ].map(([k, v], i) => `<div class="stat" style="animation-delay:${.3 + i * .1}s"><small>${k}</small><b>${v}</b></div>`).join('');
    $('#endMsg').textContent = {
      S: 'Every ticket handled correctly.',
      A: 'Nearly every ticket handled correctly.',
      B: 'Most tickets handled correctly. Review the lessons for the rest.',
      C: 'About half correct. The KB and hints cover what you missed.',
      D: 'Fewer than half correct. Training mode removes the clock.'
    }[grade];
    const good = ['S', 'A', 'B'].includes(grade);
    showModal('#endModal'); confetti(good ? 200 : 60); beep(good ? 'level' : 'click');
    renderHUD();
  }

  /* ------------------------------ modals ------------------------------- */
  function showModal(sel) { $(sel).classList.add('show'); }
  function hideModal(sel) { $(sel).classList.remove('show'); }

  /* ------------------------------ mail admin --------------------------- */
  const MD = () => window.MAIL_DOMAIN || 'example.com';
  // internal entries store a username or list key, external ones a full address
  const mailAddr = x => (String(x).includes('@') ? x : `${x}@${MD()}`);
  const userOptions = () => Object.entries(S.world.users).map(([k, u]) => `<option value="${k}">${esc(u.name)}</option>`).join('');
  const uname = k => (S.world.users[k] ? S.world.users[k].name : k);
  function mailRun(r) { toast(esc(r.msg), r.ok ? 'good' : 'warn'); beep('click'); renderMail(); }

  function renderMail() {
    const root = $('#mailBody');
    if (!root || !S.world || !S.world.mail || !S.world.mail.boxes) return;
    const M = S.world.mail, v = S.mailView || 'box';
    const held = M.quarantine.filter(q => q.state === 'held').length;
    const tabs = [['box', 'Mailboxes'], ['shared', 'Shared & lists'], ['quar', `Quarantine${held ? ` (${held})` : ''}`], ['trace', 'Trace']];
    root.innerHTML = `<div class="seg">${tabs.map(([k, l]) => `<button data-mv="${k}" class="${v === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="mailView" class="mail-view"></div>`;
    $$('[data-mv]', root).forEach(b => b.onclick = () => { S.mailView = b.dataset.mv; beep('click'); renderMail(); });
    ({ box: mailBoxes, shared: mailShared, quar: mailQuar, trace: mailTrace })[v]($('#mailView'), M);
  }

  function mailBoxes(el, M) {
    const q = (S.mailQ || '').toLowerCase().trim();
    const rows = Object.entries(S.world.users).filter(([k, u]) => !q || (k + ' ' + u.name + ' ' + u.dept).toLowerCase().includes(q));
    el.innerHTML = `<input class="search" id="mbSearch" placeholder="Search mailboxes…" autocomplete="off">
      <div class="dir-results">${rows.map(([k, u]) => { const b = M.boxes[k] || {}; return `
        <button class="d-row ${S.mailUser === k ? 'active' : ''}" data-mu="${k}">${avatar(k, u.name, 'xs')}
          <div><b>${esc(u.name)}</b><small>${mailAddr(k)}</small></div>
          <span class="dots ${expert() ? 'hidden' : ''}">${!b.licensed ? '<i class="d off" title="No licence"></i>' : ''}${b.size / b.quota >= .9 ? '<i class="d lock" title="Almost full"></i>' : ''}${b.forward || (b.rules && b.rules.length) ? '<i class="d exp" title="Rules or forwarding"></i>' : ''}</span>
        </button>`; }).join('') || '<div class="empty-mini">No matching mailboxes</div>'}</div>
      <div id="mbDetail"></div>`;
    const s = $('#mbSearch', el);
    s.value = S.mailQ || '';
    s.oninput = () => { S.mailQ = s.value; mailBoxes(el, M); const n = $('#mbSearch', el); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    $$('[data-mu]', el).forEach(b => b.onclick = () => { S.mailUser = b.dataset.mu; beep('click'); renderMail(); });
    mailCard($('#mbDetail', el), M);
  }

  function mailCard(el, M) {
    const k = S.mailUser, u = k && S.world.users[k], b = k && M.boxes[k];
    if (!u || !b) { el.innerHTML = '<div class="empty-mini">Select a mailbox.</div>'; return; }
    const pct = Math.round(b.size / b.quota * 100);
    el.innerHTML = `<div class="u-card pop">
      <div class="u-head">${avatar(k, u.name)}<div><b>${esc(u.name)}</b><small class="mono">${mailAddr(k)}</small></div></div>
      <div class="svc"><span>Microsoft 365 licence</span>${b.licensed ? '<span class="st ok">Assigned</span>' : `<span class="st bad">None</span><button class="btn xs" id="mLic">Assign (${M.licencesFree} free)</button>`}</div>
      ${b.licensed ? `
        <div class="kv"><span>Mailbox</span><b>${b.size.toFixed(1)} / ${b.quota} GB · ${pct}%</b></div>
        <div class="meter ${pct >= 90 ? 'crit' : pct >= 75 ? 'warn' : ''}"><span style="width:${Math.min(100, pct)}%"></span></div>
        <div class="svc"><span>Online archive</span>${b.archive ? '<span class="st ok">Enabled</span>' : '<span class="st warn">Off</span><button class="btn xs" id="mArch">Enable</button>'}</div>
        <div class="svc"><span>Automatic replies</span>${b.autoReply ? '<span class="st ok">On</span><button class="btn xs ghost" id="mOooOff">Turn off</button>' : '<span class="st warn">Off</span><button class="btn xs" id="mOooOn">Set up</button>'}</div>
        <div id="mOooBox"></div>
        ${b.forward
          ? `<div class="svc fwd"><span>Forwarding to an outside address</span><button class="btn xs" id="mFwdRm">Remove</button><code class="fwd-addr">${esc(b.forward)}</code></div>`
          : '<div class="svc"><span>Forwarding</span><span class="st ok">None</span></div>'}
        <h4 class="mh">Inbox rules</h4>
        ${b.rules.length ? b.rules.map((r, i) => `<div class="rule"><div><b class="mono">${esc(r.name)}</b><small>If ${esc(r.cond)}, ${esc(r.action)}</small></div><button class="btn xs" data-rrm="${i}">Delete</button></div>`).join('') : '<div class="muted sm-t">No rules</div>'}
        <h4 class="mh">Calendar permissions</h4>
        <div class="chips-row">${b.cal.map((c, i) => `<span class="grp">${esc(uname(c.u))} · ${c.role}<button data-crm="${i}" title="Remove">×</button></span>`).join('') || '<span class="muted sm-t">Only the owner</span>'}</div>
        <div class="add-grp row"><select id="calUser">${userOptions()}</select><select id="calRole"><option>Reviewer</option><option>Editor</option></select><button class="btn xs" id="calAdd">+ Add</button></div>`
      : '<p class="muted sm-t" style="margin:0">No mailbox exists until a licence is assigned.</p>'}
    </div>`;
    const on = (id, fn) => { const e = $('#' + id, el); if (e) e.onclick = fn; };
    on('mLic', () => mailRun(OPS.licence(k)));
    on('mArch', () => mailRun(OPS.archive(k)));
    on('mOooOff', () => mailRun(OPS.autoReply(k, null)));
    on('mOooOn', () => {
      $('#mOooBox', el).innerHTML = `<div class="reset-box pop"><textarea id="oooText" rows="3">Thank you for your email. I am out of the office until Friday with limited access to email. For urgent matters, please contact the team on ops@${MD()}.</textarea>
        <div class="row"><button class="btn xs primary" id="oooGo">Turn on</button><button class="btn xs ghost" id="oooNo">Cancel</button></div></div>`;
      $('#oooNo', el).onclick = () => { $('#mOooBox', el).innerHTML = ''; };
      $('#oooGo', el).onclick = () => mailRun(OPS.autoReply(k, $('#oooText', el).value.trim() || 'Out of office.'));
    });
    on('mFwdRm', () => mailRun(OPS.forwardOff(k)));
    $$('[data-rrm]', el).forEach(x => x.onclick = () => mailRun(OPS.ruleRemove(k, +x.dataset.rrm)));
    $$('[data-crm]', el).forEach(x => x.onclick = () => mailRun(OPS.calRemove(k, b.cal[+x.dataset.crm].u)));
    on('calAdd', () => mailRun(OPS.calAdd(k, $('#calUser', el).value, $('#calRole', el).value)));
  }

  function mailShared(el, M) {
    const groups = [
      ...Object.entries(M.shared).map(([k, g]) => ({ k, type: 'shared', g })),
      ...Object.entries(M.dls).map(([k, g]) => ({ k, type: 'dl', g }))
    ];
    const cur = groups.find(x => x.k === S.mailGroup) || groups[0];
    const chip = (k, attr) => `<span class="grp">${esc(uname(k))}<button ${attr}="${k}" title="Remove">×</button></span>`;
    let body;
    if (cur.type === 'shared') {
      body = `<div class="kv"><span>Type</span><b>Shared mailbox</b></div>
        <h4 class="mh">Full Access <small class="muted">(open and read)</small></h4><div class="chips-row">${cur.g.full.map(k => chip(k, 'data-fa')).join('') || '<span class="muted sm-t">Nobody</span>'}</div>
        <h4 class="mh">Send As <small class="muted">(send from this address)</small></h4><div class="chips-row">${cur.g.sendAs.map(k => chip(k, 'data-sa')).join('') || '<span class="muted sm-t">Nobody</span>'}</div>
        <div class="add-grp row"><select id="shUser">${userOptions()}</select><select id="shPerm"><option>Full Access</option><option>Send As</option></select><button class="btn xs" id="shAdd">+ Add</button></div>`;
    } else if (cur.g.dynamic) {
      body = `<div class="kv"><span>Type</span><b>Distribution list (dynamic)</b></div><p class="muted sm-t" style="margin:0">Every enabled staff account is a member automatically.</p>`;
    } else {
      body = `<div class="kv"><span>Type</span><b>Distribution list</b></div>
        <h4 class="mh">Members (${cur.g.members.length})</h4><div class="chips-row">${cur.g.members.map(k => chip(k, 'data-dm')).join('') || '<span class="muted sm-t">No members</span>'}</div>
        <div class="add-grp row"><select id="dlUser">${userOptions()}</select><button class="btn xs" id="dlAdd">+ Add member</button></div>`;
    }
    el.innerHTML = `<label class="field"><span>Shared mailbox or list</span><select id="grpPick">${groups.map(x => `<option value="${x.k}" ${x === cur ? 'selected' : ''}>${x.type === 'shared' ? 'Shared' : 'List'} · ${mailAddr(x.k)}</option>`).join('')}</select></label>
      <div class="u-card pop"><div class="u-head"><div><b>${esc(cur.g.name)}</b><small class="mono">${mailAddr(cur.k)}</small></div></div>${body}</div>`;
    $('#grpPick', el).onchange = e => { S.mailGroup = e.target.value; renderMail(); };
    $$('[data-fa]', el).forEach(x => x.onclick = () => mailRun(OPS.sharedRemove(cur.k, x.dataset.fa, 'Full Access')));
    $$('[data-sa]', el).forEach(x => x.onclick = () => mailRun(OPS.sharedRemove(cur.k, x.dataset.sa, 'Send As')));
    $$('[data-dm]', el).forEach(x => x.onclick = () => mailRun(OPS.dlRemove(cur.k, x.dataset.dm)));
    const shAdd = $('#shAdd', el);
    if (shAdd) shAdd.onclick = () => mailRun(OPS.sharedAdd(cur.k, $('#shUser', el).value, $('#shPerm', el).value));
    const dlAdd = $('#dlAdd', el);
    if (dlAdd) dlAdd.onclick = () => mailRun(OPS.dlAdd(cur.k, $('#dlUser', el).value));
  }

  function mailQuar(el, M) {
    const items = [...M.quarantine].reverse();
    el.innerHTML = items.length ? items.map(q => `
      <div class="qmsg ${q.state}">
        <div class="qtop"><span class="st ${q.malicious ? 'bad' : 'warn'}">${esc(q.reason)}</span><small class="muted mono">${esc(q.time)}</small></div>
        <b>${esc(q.subject)}</b>
        <small class="mono">From ${esc(q.from)}</small>
        <small class="mono">To ${esc(mailAddr(q.to))}</small>
        <details><summary>Details</summary><small>${esc(q.detail)}</small></details>
        ${q.state === 'held'
          ? `<div class="row"><button class="btn xs" data-rel="${q.id}">Release to inbox</button><button class="btn xs ghost" data-del="${q.id}">Delete</button></div>`
          : `<span class="st ${q.state === 'released' ? 'ok' : ''}">${q.state === 'released' ? 'Released' : 'Deleted'}</span>`}
      </div>`).join('') : '<div class="empty-mini">Quarantine is empty.</div>';
    $$('[data-rel]', el).forEach(x => x.onclick = () => mailRun(OPS.qRelease(x.dataset.rel)));
    $$('[data-del]', el).forEach(x => x.onclick = () => mailRun(OPS.qDelete(x.dataset.del)));
  }

  function mailTrace(el, M) {
    const q = (S.traceQ || '').toLowerCase().trim();
    const res = OPS.trace(q); // a name matches its username, so "farah" finds fnadia's mail
    const cls = s => (s === 'Delivered' ? 'ok' : s === 'Failed' ? 'bad' : 'warn');
    el.innerHTML = `<form class="row" id="trForm"><input class="search" id="trQ" placeholder="Sender, recipient or name" autocomplete="off"><button class="btn sm primary">Trace</button></form>
      <div class="trace">${q.length < 2 ? '<div class="empty-mini">Search by person or address to see what happened to their email in the last 48 hours.</div>'
        : res.length ? res.map(e => `
          <button class="tr ${S.traceOpen === e.id ? 'open' : ''}" data-tr="${e.id}">
            <span class="mono muted">${esc(e.time)}</span>
            <span class="tr-main"><b>${esc(e.subject)}</b><small class="mono">${esc(mailAddr(e.from))} → ${esc(mailAddr(e.to))}</small>${S.traceOpen === e.id ? `<small class="tr-detail mono">${esc(e.detail)}</small>` : ''}</span>
            <span class="st ${cls(e.status)}">${e.status}</span>
          </button>`).join('') : '<div class="empty-mini">No messages found.</div>'}</div>`;
    $('#trQ', el).value = S.traceQ || '';
    $('#trForm', el).onsubmit = e => {
      e.preventDefault();
      S.traceQ = $('#trQ', el).value; S.traceOpen = null;
      if (S.traceQ.trim().length >= 2) act('trace', `Ran message trace for "${S.traceQ.trim()}"`);
      beep('click'); renderMail();
    };
    $$('[data-tr]', el).forEach(x => x.onclick = () => { S.traceOpen = S.traceOpen === x.dataset.tr ? null : x.dataset.tr; renderMail(); });
  }

  /* ------------------------------ KB ----------------------------------- */
  function renderKB() {
    const q = ($('#kbSearch').value || '').toLowerCase();
    $('#kbList').innerHTML = window.KB.filter(k => !q || (k.title + k.body).toLowerCase().includes(q)).map(k => `
      <details class="kb"><summary>${esc(k.title)}</summary><div>${k.body}</div></details>`).join('') || '<div class="empty-mini">No articles found</div>';
  }

  /* ------------------------------ wire up ------------------------------ */
  function init() {
    $$('.tabs button').forEach(b => b.addEventListener('click', () => { beep('click'); switchTab(b.dataset.tab); }));
    requestAnimationFrame(() => switchTab('dir'));
    addEventListener('resize', () => { const a = $('.tabs button.active'); if (a) switchTab(a.dataset.tab); });

    $('#dirSearch').addEventListener('input', renderDirectory);
    $('#kbSearch').addEventListener('input', renderKB);
    renderKB();

    $('#termForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (term.busy) return;
      const v = $('#termInput').value; $('#termInput').value = '';
      term.busy = true; $('#termForm').classList.add('busy');
      try { await runCmd(v); } finally { term.busy = false; $('#termForm').classList.remove('busy'); termPrompt(); }
    });
    $('#termInput').addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); term.hi = Math.max(0, term.hi - 1); $('#termInput').value = term.hist[term.hi] || ''; }
      if (e.key === 'ArrowDown') { e.preventDefault(); term.hi = Math.min(term.hist.length, term.hi + 1); $('#termInput').value = term.hist[term.hi] || ''; }
    });
    $('#termOut').addEventListener('click', () => $('#termInput').focus());

    $('#muteBtn').addEventListener('click', () => { S.muted = !S.muted; store.set('muted', S.muted); renderHUD(); });

    // start modal
    $('#agentInput').value = S.agent;
    $$('.mode-opt').forEach(o => o.addEventListener('click', () => { $$('.mode-opt').forEach(x => x.classList.remove('active')); o.classList.add('active'); S.mode = o.dataset.mode; beep('click'); }));
    $('#startForm').addEventListener('submit', e => {
      e.preventDefault();
      S.agent = $('#agentInput').value.trim() || 'Agent';
      store.set('agent', S.agent);
      hideModal('#startModal');
      beep('good');
      startShift();
    });

    $('#resolveBtn').addEventListener('click', () => closeTicket('resolve'));
    $('#escBtn').addEventListener('click', () => closeTicket('escalate'));
    $('#cancelClose').addEventListener('click', () => { hideModal('#closeModal'); S.paused = false; });
    $('#nextBtn').addEventListener('click', afterResult);
    $('#lvlBtn').addEventListener('click', () => { hideModal('#levelModal'); resumeOrEnd(); });
    $('#monClose').addEventListener('click', closeMonitor);
    $('#againBtn').addEventListener('click', () => { hideModal('#endModal'); showModal('#startModal'); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#closeModal').classList.contains('show')) { hideModal('#closeModal'); S.paused = false; }
      if (e.key === 'Escape' && $('#cctvModal').classList.contains('show')) closeMonitor();
    });

    renderHUD();
    renderTicket();
    S.world = newWorld();
    renderDirectory(); renderRemote(); renderMail(); termReset();
    showModal('#startModal');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
