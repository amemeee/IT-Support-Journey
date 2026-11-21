/* IT Support Journey — landing page */
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
    ['p', 'KD-ENG-007(guided)> ', 'ipconfig'],
    ['o', '   IPv4 Address. . . . : 169.254.88.12'],
    ['o', '   Default Gateway . . : '],
    ['c', '# 169.254.x.x means DHCP failed'],
    ['p', 'KD-ENG-007(guided)> ', 'ipconfig /release'],
    ['o', '   IPv4 address released.'],
    ['p', 'KD-ENG-007(guided)> ', 'ipconfig /renew'],
    ['o', '   IPv4 Address. . . . : 10.12.7.7'],
    ['p', 'KD-ENG-007> ', 'ping google.com'],
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
    ["Fake Dato' call", 'socialeng'], ['MFA reset', 'mfa'], ['Liquid spill', 'hardware'], ['Expat needs VPN', 'expatvpn'], ['MFA fatigue attack', 'mfafatigue']
  ];
  $('#scenGrid').innerHTML = scenarios.map(([t, id]) => `<a class="tag" href="sim.html?s=${id}">${t}</a>`).join('');

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
