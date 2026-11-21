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
  const QUESTIONS = [
    { k: 'error', label: 'What error do you see?', bm: 'Apa mesej ralat?', re: /error|message|ralat|say|see|screen|pop/ },
    { k: 'when', label: 'When did this start?', bm: 'Bila mula?', re: /when|start|since|bila|how long/ },
    { k: 'restart', label: 'Have you restarted?', bm: 'Dah restart?', re: /restart|reboot|turn (it )?off|mulakan semula/ },
    { k: 'computer', label: "What's your computer name?", bm: 'Nama komputer?', re: /computer|pc|laptop|hostname|machine|asset|device|komputer/ },
    { k: 'others', label: 'Is anyone else affected?', bm: 'Orang lain pun sama?', re: /anyone|others|colleague|everyone|else|orang lain/ },
    { k: 'verify', label: 'Please verify your staff ID', bm: 'ID pekerja anda?', re: /verify|staff|employee|\bid\b|identity|pekerja/ },
    { k: 'retry', label: 'Can you try again now?', bm: 'Cuba lagi sekarang?', re: /try again|cuba|work(s|ing)? now|fixed|ok now|selesai/ }
  ];

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

  /* ------------------------------ shift lifecycle ---------------------- */
  function startShift() {
    S.world = { users: clone(window.DIRECTORY), hosts: clone(window.HOSTS), outage: false };
    const escs = window.SCENARIOS.filter(s => s.escalate), fix = window.SCENARIOS.filter(s => !s.escalate);
    S.deck = shuffle([...shuffle(escs).slice(0, 2), ...shuffle(fix).slice(0, SHIFT_SIZE - 2)]);
    // ?s=<scenario id> puts a specific scenario first (linked from the landing page)
    const want = new URLSearchParams(location.search).get('s');
    const picked = window.SCENARIOS.find(s => s.id === want);
    if (picked) S.deck = [picked, ...S.deck.filter(s => s !== picked)].slice(0, SHIFT_SIZE);
    Object.assign(S, { tickets: [], activeId: null, score: 0, closed: 0, correct: 0, csat: [], xpGained: 0, elapsed: 0, session: null, selUser: null, paused: false, running: true });
    S.nextSpawn = 8;
    $('#queueList').innerHTML = '';
    renderTicket(); renderDirectory(); renderRemote(); termReset(); renderHUD();
    spawn(); setTimeout(spawn, 1200);
    clearInterval(S.timer);
    S.timer = setInterval(tick, 1000);
  }

  function tick() {
    if (S.paused || !S.running) return;
    S.elapsed++;
    const open = S.tickets.filter(t => t.status === 'open');
    if (S.mode === 'standard') {
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
        <div class="sla"><span style="width:${S.mode === 'standard' ? Math.max(0, t.slaLeft / t.slaTotal * 100) : 100}%"></span></div>
      </button>`;
    }).join('');
    $$('.q-card', list).forEach(b => b.addEventListener('click', () => { beep('click'); openTicket(b.dataset.id, true); }));
    updateSLAs();
  }

  function updateSLAs() {
    S.tickets.filter(t => t.status === 'open').forEach(t => {
      const pct = S.mode === 'standard' ? Math.max(0, t.slaLeft / t.slaTotal * 100) : 100;
      const cls = pct < 25 ? 'crit' : pct < 50 ? 'warn' : '';
      const card = $(`.q-card[data-id="${t.id}"] .sla`);
      if (card) { card.className = 'sla ' + cls; card.firstElementChild.style.width = pct + '%'; }
      if (t.id === S.activeId) {
        const big = $('#tSla');
        if (big) {
          big.className = 'sla big ' + cls;
          big.firstElementChild.style.width = pct + '%';
          $('#tSlaText').textContent = S.mode === 'standard' ? (t.breached ? 'SLA BREACHED' : fmt(t.slaLeft) + ' left') : 'Training mode — no SLA';
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
      <div class="chips" id="chips">${QUESTIONS.map(q => `<button class="q-chip ${t.asked.has(q.k) && q.k !== 'retry' ? 'used' : ''}" data-k="${q.k}">${q.label}<small>${q.bm}</small></button>`).join('')}</div>
      <form class="chat-in" id="chatForm"><input id="chatInput" placeholder="Type a message to ${esc(u.name.split(' ')[0])}…" autocomplete="off"><button class="btn primary sm">Send</button></form>
      <div class="t-foot">
        <button class="btn ghost sm" id="hintBtn">Hint${S.mode === 'standard' ? ' (−10)' : ''}</button>
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
      const q = QUESTIONS.find(q => q.re.test(v.toLowerCase()));
      ask(t, q ? q.k : null, v);
    });
    $('#hintBtn').addEventListener('click', () => showHint(t));
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
        <span class="dots">${!u.enabled ? '<i class="d off" title="Disabled"></i>' : ''}${u.locked ? '<i class="d lock" title="Locked"></i>' : ''}${u.pwdExpired ? '<i class="d exp" title="Password expired"></i>' : ''}</span>
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
          <button class="btn sm" id="aUnlock" ${u.locked ? '' : 'disabled'}>Unlock</button>
          <button class="btn sm" id="aReset">Reset password</button>
          <button class="btn sm" id="aMfa">Reset MFA</button>
          <button class="btn sm ${u.enabled ? 'danger-o' : ''}" id="aToggle">${u.enabled ? 'Disable' : 'Enable'}</button>
        </div>
        <div id="resetBox"></div>
      </div>`;

    $('#aUnlock').onclick = () => { u.locked = false; act('unlock', `Unlocked account ${k}`, { user: k }); done('Account unlocked'); };
    $('#aToggle').onclick = () => {
      const was = u.enabled; u.enabled = !u.enabled;
      act(was ? 'disable' : 'enable', `${was ? 'Disabled' : 'Enabled'} account ${k}`, {
        user: k, harmful: was ? { key: 'disabled-' + k, label: `Disabled ${u.name}'s active account`, pts: -50 } : null
      });
      done(was ? 'Account disabled' : 'Account enabled');
    };
    $('#aMfa').onclick = () => {
      u.mfa = 'Pending re-registration'; u.mfaReset = true;
      act('resetMfa', `Reset MFA registration for ${k}`, { user: k, sensitive: true });
      done('MFA reset — user will re-register');
    };
    $('#aReset').onclick = () => {
      const pw = ['Kopi', 'Durian', 'Rambutan', 'Nasi', 'Cendol', 'Mangga'][Math.floor(Math.random() * 6)] + '-' + ['Harimau', 'Gajah', 'Helang', 'Rusa'][Math.floor(Math.random() * 4)] + '-' + Math.floor(rand(10, 99)) + '!';
      $('#resetBox').innerHTML = `<div class="reset-box pop"><div>Temporary password: <code>${pw}</code></div>
        <label><input type="checkbox" id="mustChange" checked> User must change password at next logon</label>
        <div class="row"><button class="btn xs primary" id="rsGo">Confirm reset</button><button class="btn xs ghost" id="rsNo">Cancel</button></div></div>`;
      $('#rsNo').onclick = () => { $('#resetBox').innerHTML = ''; };
      $('#rsGo').onclick = () => {
        const must = $('#mustChange').checked;
        u.pwdExpired = false; u.locked = false;
        act('resetPwd', `Reset password for ${k}${must ? ' (must change at next logon)' : ''}`, {
          user: k, sensitive: true, harmful: must ? null : { key: 'nochange', label: 'Temp password not forced to change', pts: -10 }
        });
        done('Password reset');
      };
    };
    $('#grpAdd').onclick = () => {
      const g = $('#grpSel').value; if (!g) return;
      u.groups.push(g);
      act('addGroup', `Added ${k} to ${g}`, {
        user: k, harmful: g === 'Domain Admins' ? { key: 'da-' + k, label: 'Granted Domain Admins — huge security risk!', pts: -200 } : null
      });
      done(`Added to ${g}`);
    };
    $$('[data-rm]', box).forEach(b => b.onclick = () => {
      const g = b.dataset.rm; u.groups = u.groups.filter(x => x !== g);
      act('removeGroup', `Removed ${k} from ${g}`, { user: k });
      done(`Removed from ${g}`);
    });

    function done(msg) { toast(msg, 'good', '✔️'); beep('click'); renderDirectory(); }
  }

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
        <div class="row"><input id="connHost" placeholder="e.g. KD-HR-022" autocomplete="off" class="mono"><button class="btn primary sm">Connect</button></div></form>`;
      $('#connForm').onsubmit = e => { e.preventDefault(); connect($('#connHost').value); };
      return;
    }
    const host = S.session.host, h = S.world.hosts[host], owner = S.world.users[h.owner];
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
    if (name === 'mymy.gov.my' || name === 'mytax.hasil.gov.my') return '203.115.200.10';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) return name;
    return null;
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
          'cls                   clear screen'
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
        const down = (name.startsWith('mail') && S.world && S.world.outage) || ip === '10.12.0.99';
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
      if (S.mode === 'standard' && !t.breached) { const b = Math.round(30 * t.slaLeft / t.slaTotal); if (b > 0) lines.push(['Speed bonus', b]); }
      if (action === 'resolve' && t.asked.has('retry')) lines.push(['Confirmed the fix with the user', 10]);
    }
    if (note.trim().length >= 20) lines.push(['Clear resolution notes', 10]);
    else lines.push(['Missing / thin ticket notes', -5]);
    if (t.breached) lines.push(['SLA breached', -25]);
    if (t.hints && S.mode === 'standard') lines.push([`Hints used (${t.hints})`, -10 * t.hints]);
    t.flags.forEach(f => lines.push([f.label, f.pts]));
    const pts = lines.reduce((s, l) => s + l[1], 0);
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
    $('#againBtn').addEventListener('click', () => { hideModal('#endModal'); showModal('#startModal'); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#closeModal').classList.contains('show')) { hideModal('#closeModal'); S.paused = false; }
    });

    renderHUD();
    renderTicket();
    S.world = { users: clone(window.DIRECTORY), hosts: clone(window.HOSTS), outage: false };
    renderDirectory(); renderRemote(); termReset();
    showModal('#startModal');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
