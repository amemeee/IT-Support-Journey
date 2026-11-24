/* IT Support Journey — landing page */
import '../styles/style.css';

(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  $('#yr').textContent = new Date().getFullYear();

  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

  /* fade sections in as they enter the viewport */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* sample queue: new tickets arrive, old ones get resolved */
  const pool = [
    ['P3', 'Locked out after Raya leave', 'Nurul Aisyah · HR', 'NA', 'naisyah'],
    ['P1', '"LHDN e-Invoice" phishing email', 'Jason Wong · Sales', 'JW', 'jwong'],
    ['P2', 'No network on desktop', 'Muhammad Faiz · Engineering', 'MF', 'mfaiz'],
    ['P3', 'Print jobs stuck on Level 12', 'Lim Siew Ling · Operations', 'LS', 'lsling'],
    ['P1', "URGENT — Dato' needs password", 'Unknown caller', '?', 'caller'],
    ['P2', 'New phone, MFA not working', 'Farah Nadia · Finance', 'FN', 'fnadia'],
    ['P4', 'Need Zoom installed', 'Daniel Raj · Marketing', 'DR', 'draj'],
    ['P3', 'Outlook crashes on launch', 'Siti Hajar · Legal', 'SH', 'shajar'],
    ['P2', 'Teh tarik spilled on laptop', 'Arjun · Customer Support', 'AS', 'arjun'],
    ['P3', 'HR portal cannot load', 'Kavitha · Marketing', 'KR', 'kavitha']
  ];
  const mq = $('#mockQueue');
  let pi = 0;
  function addMock() {
    const [p, t, u, a, key] = pool[pi++ % pool.length];
    const el = document.createElement('div');
    el.className = 'mq';
    el.innerHTML = `<div class="ava">${a}<img src="assets/avatars/${key}.webp" alt="" width="192" height="192" decoding="async" loading="lazy" onerror="this.remove()"></div><div><b>${t}</b><small>${u}</small></div><span class="prio ${p}">${p}</span>`;
    mq.prepend(el);
    const items = $$('.mq:not(.resolved)', mq);
    if (items.length > 5) {
      const old = items[items.length - 1 - Math.floor(Math.random() * 2)];
      old.classList.add('resolved');
      setTimeout(() => old.remove(), 900);
    }
  }
  for (let i = 0; i < 4; i++) addMock();
  if (!reduced) setInterval(addMock, 2800);

  /* terminal demo, typed out once it scrolls into view */
  const script = [
    ['p', 'XYZ-ENG-007(guided)> ', 'ipconfig'],
    ['o', '   IPv4 Address. . . . : 169.254.88.12'],
    ['o', '   Default Gateway . . : '],
    ['c', '# 169.254.x.x means DHCP failed'],
    ['p', 'XYZ-ENG-007(guided)> ', 'ipconfig /release'],
    ['o', '   IPv4 address released.'],
    ['p', 'XYZ-ENG-007(guided)> ', 'ipconfig /renew'],
    ['o', '   IPv4 Address. . . . : 10.12.7.7'],
    ['p', 'XYZ-ENG-007> ', 'ping google.com'],
    ['o', '   Reply from 142.250.4.100: time=9ms']
  ];
  const td = $('#termDemo');
  async function runDemo() {
    for (;;) {
      td.innerHTML = '';
      for (const [kind, a, b] of script) {
        const line = document.createElement('div');
        td.appendChild(line);
        if (kind === 'p') {
          line.innerHTML = `<span class="p">${a}</span><span class="t"></span><span class="caret"></span>`;
          const t = line.querySelector('.t');
          for (const ch of b) { t.textContent += ch; await sleep(reduced ? 0 : 50 + Math.random() * 50); }
          await sleep(350);
          line.querySelector('.caret').remove();
        } else {
          if (kind === 'c') line.className = 'cmt';
          line.textContent = a;
          await sleep(kind === 'c' ? 500 : 260);
        }
      }
      await sleep(3500);
    }
  }
  const tio = new IntersectionObserver(es => { if (es[0].isIntersecting) { runDemo(); tio.disconnect(); } }, { threshold: .3 });
  tio.observe(td);

  /* scenario links */
  const scenarios = [
    ['Account lockout', 'lockout'], ['Expired password', 'pwdexpired'], ['Shared drive access', 'share'],
    ['Stuck print queue', 'printer'], ['No network (APIPA)', 'nointernet'], ['Stale DNS cache', 'dns'],
    ['LHDN phishing email', 'phishing'], ['Outlook crashing', 'outlook'], ['Software request', 'software'],
    ['Email outage', 'outage'], ['New hire onboarding', 'newhire'], ['Disk full', 'diskfull'],
    ["Fake Dato' call", 'socialeng'], ['MFA reset', 'mfa'], ['Liquid spill', 'hardware'], ['Expat needs VPN', 'expatvpn'], ['MFA fatigue attack', 'mfafatigue'], ['CCTV camera offline', 'cctv'], ['CCTV footage request', 'cctvfootage'],
    ['Mailbox full', 'mailfull'], ['Shared mailbox access', 'sharedmbx'], ['Missing from team list', 'dlmissing'],
    ['Invoice stuck in quarantine', 'quarinvoice'], ['Hidden inbox rule', 'inboxrule'], ['Email bounced (typo)', 'typo'],
    ['Calendar access', 'calendar'], ['Send As permission', 'sendas'], ['Out-of-office for a colleague', 'autoreply'],
    ["Touch 'n Go PIN scam", 'tngscam'], ['Intern has no mailbox', 'licence'], ['Attachment too big', 'bigattach'],
    ['Remove old access', 'removeaccess'], ['Courier scam release', 'courier'], ['Payroll sent to all-staff', 'payrollleak'],
    ['BitLocker recovery', 'bitlocker'], ["Colleague's BitLocker key", 'bitlockerother'], ['Laptop left in a Grab', 'lostlaptop'],
    ['Stolen laptop wipe', 'stolenwipe'], ['USB blocked', 'usbblocked'], ['Approved USB exception', 'usbapproved'],
    ['Windows Update stuck', 'updatestuck'], ['Firewall turned off', 'firewalloff'], ['Blue screen after driver update', 'bsod'],
    ['Swollen battery', 'battery'], ['Ransomware', 'ransomware'], ['Clock out of sync', 'timeskew'],
    ['New laptop not assigned', 'assigndevice'], ['Encryption off', 'encryptionoff'], ['Lost personal phone', 'lostphone'],
    ['Wi-Fi down in one wing', 'apdown'], ['Visitor wants Wi-Fi', 'guestwifi'], ['VPN blocked at a hotel', 'hotelvpn'],
    ['Home fibre down (WFH)', 'homeunifi'], ['Printer IP changed', 'printerip'], ['IP address conflict', 'dupip'],
    ['Supplier site blocked', 'filterwork'], ['Unblock a 4D site', 'filtergamble'], ['Teams choppy for everyone', 'teamschoppy'],
    ['Unknown box in meeting room', 'rogueport'], ['Wi-Fi drops at lunch', 'wifiband'], ['Floor offline after storm', 'powertrip'],
    ['VPN password attack', 'vpnattack'], ['Branch cannot reach HQ', 'branchvpn'], ['One website slow', 'slowsite'],
    ['OneDrive red X', 'onedrivesync'], ['Public link on salary file', 'publiclink'], ['SharePoint site access', 'spsite'],
    ['Teams camera busy', 'teamscamera'], ['Nobody hears me on Teams', 'teamsmic'], ['Deleted SharePoint folder', 'sprestore'],
    ['Overwrote a spreadsheet', 'versionhistory'], ['MyInvois portal access', 'myinvois'], ['Excel crashes (add-in)', 'exceladdin'],
    ['Bad browser extension', 'chromeext'], ['Meeting room double-booked', 'roombooking'], ['WhatsApp Desktop request', 'whatsappdesktop'],
    ['Teams chat with a partner', 'teamsexternal'], ['Team with no owner', 'teamsowner'], ['Consent phishing app', 'oauthconsent']
  ];
  $('#scenGrid').innerHTML = scenarios.map(([t, id]) => `<a class="tag" href="sim.html?s=${id}">${t}</a>`).join('');

  /* ---------- playable mini ticket ---------- */
  const face = key => `<img class="face" src="assets/avatars/${key}.webp" alt="" width="44" height="44">`;
  const steps = [
    {
      q: 'What do you do first?',
      opts: [
        { t: 'Reset her password', pts: -10, fb: "Not yet. You don't know who you're talking to, and she may not need a new password at all." },
        { t: 'Look her up in the directory', pts: 10, ok: true, fb: 'Right. Look before you change anything.' },
        { t: 'Escalate to Security', pts: -10, fb: 'Nothing suspicious here. A lockout is an L1 fix, and Security will bounce it back.' }
      ]
    },
    {
      q: 'Searching "Nurul" finds two people. She gives you her staff ID: <b class="mono">XYZ20417</b>. Which account is hers?',
      dir: true,
      opts: [
        { t: 'Nurul Aisyah binti Ahmad', sub: 'HR · XYZ20417 · Locked out', key: 'naisyah', pts: 10, ok: true, fb: 'The staff ID and department both match.' },
        { t: 'Nurul Ain binti Razak', sub: 'Operations · XYZ31877 · OK', key: 'nain', pts: -40, fb: "That's Nurul Ain from the warehouse. Changing the wrong person's account costs 40 points." }
      ]
    },
    {
      q: 'Her account says <b>Locked out</b>, and her password is still valid. What\'s the fix?',
      opts: [
        { t: 'Unlock the account', pts: 100, ok: true, fb: 'That\'s the whole fix. She knows her password, she just typed the old one too many times.' },
        { t: 'Reset her password', pts: -10, fb: 'It would work, but it\'s overkill. Now she has to learn a new password for no reason.' },
        { t: 'Disable it and enable it again', pts: -50, fb: 'Disabling an active account can break her email and sessions. Never use it as a fix.' }
      ]
    },
    {
      q: 'Done. Close the ticket now?',
      opts: [
        { t: 'Ask her to try again first', pts: 10, ok: true, fb: 'Always confirm the fix with the user before you close a ticket.' },
        { t: 'Close it, it\'s obviously fixed', pts: 0, ok: true, fb: 'It probably is. In the simulator, confirming first earns 10 extra points.' }
      ]
    }
  ];
  const mini = { i: 0, score: 0 };
  const stepEl = $('#miniStep');

  function setScore(delta) {
    mini.score += delta;
    const el = $('#miniScore');
    el.textContent = mini.score + ' pts';
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  function renderStep() {
    const s = steps[mini.i];
    $('#miniBar').style.width = (mini.i / steps.length * 100) + '%';
    stepEl.innerHTML = `<p class="mini-q">${s.q}</p>
      <div class="mini-opts ${s.dir ? 'dir' : ''}">${s.opts.map((o, j) => `
        <button class="mini-opt" data-j="${j}">${o.key ? face(o.key) : ''}<span><b>${o.t}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span><em class="mono"></em></button>`).join('')}
      </div>
      <div class="mini-fb" aria-live="polite"></div>`;
    stepEl.classList.remove('enter'); void stepEl.offsetWidth; stepEl.classList.add('enter');
    $$('.mini-opt', stepEl).forEach(b => b.addEventListener('click', () => choose(b)));
  }

  function choose(btn) {
    const o = steps[mini.i].opts[+btn.dataset.j];
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add(o.ok ? 'right' : 'wrong');
    btn.querySelector('em').textContent = (o.pts > 0 ? '+' : '') + o.pts;
    setScore(o.pts);
    const fb = $('.mini-fb', stepEl);
    fb.innerHTML = `<p>${o.fb}</p>`;
    fb.classList.remove('show'); void fb.offsetWidth; fb.classList.add('show');
    if (o.ok) {
      const li = $$('#learnList li')[mini.i]; if (li) li.classList.add('done');
      $$('.mini-opt', stepEl).forEach(b => { b.disabled = true; });
      fb.insertAdjacentHTML('beforeend', `<button class="btn primary sm" id="miniNext">${mini.i < steps.length - 1 ? 'Next' : 'See result'}</button>`);
      $('#miniNext').addEventListener('click', () => { mini.i++; mini.i < steps.length ? renderStep() : finish(); });
    } else {
      fb.insertAdjacentHTML('beforeend', '<small class="muted">Pick another option.</small>');
    }
  }

  function finish() {
    $('#miniBar').style.width = '100%';
    const best = 130;
    const stars = mini.score >= best ? 5 : mini.score >= 100 ? 4 : mini.score >= 60 ? 3 : 2;
    stepEl.innerHTML = `
      <div class="msg">${face('naisyah')}<div><small>Nurul Aisyah · HR Executive</small><p>Eh, it works now! Terima kasih banyak-banyak 🙏</p></div></div>
      <div class="mini-end">
        <div><span class="big mono">${mini.score}</span><small>points (best possible: ${best})</small></div>
        <div class="stars-row">${'★'.repeat(stars)}<span>${'★'.repeat(5 - stars)}</span></div>
        <p>That was one ticket. A shift has eight, and they don't all come with a friendly user and an obvious answer.</p>
        <div class="cta-row"><a class="btn primary" href="sim.html">Clock in for a full shift</a><button class="btn ghost" id="miniAgain">Play it again</button></div>
      </div>`;
    stepEl.classList.remove('enter'); void stepEl.offsetWidth; stepEl.classList.add('enter');
    $('#miniAgain').addEventListener('click', () => {
      mini.i = 0; mini.score = 0; $('#miniScore').textContent = '0 pts';
      $$('#learnList li').forEach(li => li.classList.remove('done'));
      renderStep();
    });
  }
  renderStep();

  /* BM phrase cards */
  const phrases = [
    ['Boleh saya dapatkan ID pekerja anda?', 'May I have your staff ID?'],
    ['Tunggu sekejap ya.', 'Please hold on a moment.'],
    ['Apa mesej ralat yang keluar?', 'What error message appears?'],
    ['Sila mulakan semula komputer anda.', 'Please restart your computer.'],
    ['Boleh cuba sekali lagi sekarang?', 'Can you try again now?'],
    ['Orang lain pun ada masalah sama?', 'Is anyone else having the same problem?'],
    ['Saya akan escalate kepada pasukan Security.', "I'll escalate this to the Security team."],
    ['Terima kasih atas kesabaran anda.', 'Thank you for your patience.']
  ];
  let ph = 0;
  const flip = $('#phraseFlip');
  function showPhrase() {
    const wasFlipped = flip.classList.contains('flipped');
    flip.classList.remove('flipped');
    setTimeout(() => {
      $('#phraseFront').textContent = phrases[ph][0];
      $('#phraseBack').textContent = phrases[ph][1];
      $('#phraseIdx').textContent = `${ph + 1} / ${phrases.length}`;
    }, wasFlipped ? 300 : 0);
  }
  flip.addEventListener('click', () => flip.classList.toggle('flipped'));
  $('#phraseNext').addEventListener('click', () => { ph = (ph + 1) % phrases.length; showPhrase(); });
  $('#phrasePrev').addEventListener('click', () => { ph = (ph - 1 + phrases.length) % phrases.length; showPhrase(); });
  showPhrase();
})();
