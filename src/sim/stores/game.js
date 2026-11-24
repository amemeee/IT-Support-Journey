/* =========================================================
   Game store (Pinia): shift, tickets, chat, logging, grading.
   Everything the screen shows comes from this state, so
   components never need to redraw anything by hand.
   ========================================================= */
import { defineStore } from 'pinia';
import { ref, reactive, computed, markRaw } from 'vue';
import * as DATA from '../../data/index.js';
import { clone, rand, shuffle, sleep, storage } from '../lib/util.js';
import { toast, beep, confetti, floatText } from '../lib/fx.js';
import { QUESTIONS } from '../lib/questions.js';

export const LEVELS = [
  { xp: 0, name: 'Trainee' },
  { xp: 300, name: 'IT Support Tech I' },
  { xp: 800, name: 'IT Support Tech II' },
  { xp: 1600, name: 'Senior IT Support' },
  { xp: 3000, name: 'L2 Support Engineer' },
  { xp: 5000, name: 'IT Support Lead' }
];
export const SLA = { P1: 150, P2: 210, P3: 300, P4: 420 }; // seconds to resolve
export const SHIFT_SIZE = 8;
const SPAWN_EVERY = 45;     // seconds between new tickets
const AWAY_CHANCE = 0.3;    // chance a (non-P1) user is in a meeting when the ticket arrives

export const levelOf = xp => { let i = 0; LEVELS.forEach((l, j) => { if (xp >= l.xp) i = j; }); return i; };
export const targetsOf = sc => sc.targets || [sc.user];

export const useGame = defineStore('game', () => {
  /* ---------- persistent player data ---------- */
  const agent = ref(storage.get('agent', ''));
  const xp = ref(storage.get('xp', 0));
  const best = ref(storage.get('best', 0));
  const muted = ref(storage.get('muted', false));
  const mode = ref('standard'); // standard | training | expert

  /* ---------- shift state ---------- */
  const world = ref(newWorld());
  const deck = ref([]);
  const tickets = ref([]);
  const activeId = ref(null);
  const score = ref(0), closed = ref(0), correct = ref(0), xpGained = ref(0);
  const csat = ref([]);
  const elapsed = ref(0);
  const paused = ref(true), running = ref(false);
  const session = ref(null); // remote session { host, guided }
  let seq = 1040, nextSpawn = 0, timer = null, firstTicket = true;

  /* ---------- UI state shared between components ---------- */
  const ui = reactive({
    tab: 'dir', selUser: null, dirQ: '',
    mailView: 'box', mailUser: null, mailQ: '', mailGroup: null, traceQ: '', traceOpen: null,
    devSel: null, devQ: '', netView: 'overview', appView: 'onedrive',
    progress: null,   // { label, ms } while a remote action runs
    shake: 0,         // bumped to shake the ticket pane
    scoreBump: 0
  });
  const modals = reactive({ start: true, close: false, result: false, level: false, end: false, monitor: false });
  const closing = ref(null);   // ticket being closed
  const result = ref(null);    // last grading result
  const endStats = ref(null);
  const monitor = reactive({ host: null, only: null });
  let pendingLevel = false;

  /* ---------- derived ---------- */
  const timed = computed(() => mode.value !== 'training');   // SLA clock in Standard and Expert
  const expert = computed(() => mode.value === 'expert');     // no question buttons, hints or giveaways
  const level = computed(() => levelOf(xp.value));
  const openTickets = computed(() => tickets.value
    .filter(t => t.status === 'open')
    .sort((a, b) => a.sc.priority.localeCompare(b.sc.priority) || a.created - b.created));
  const activeTicket = computed(() => tickets.value.find(t => t.id === activeId.value && t.status === 'open') || null);
  const avgCsat = computed(() => (csat.value.length ? csat.value.reduce((a, b) => a + b, 0) / csat.value.length : null));

  function newWorld() {
    return {
      users: clone(DATA.DIRECTORY), hosts: clone(DATA.HOSTS), mail: clone(DATA.MAIL),
      devices: clone(DATA.DEVICES), net: clone(DATA.NETWORK), apps: clone(DATA.APPS), traced: [], outage: false
    };
  }
  const uname = k => (world.value.users[k] ? world.value.users[k].name : k);

  /* ---------- shift lifecycle ---------- */
  function startShift(name, chosenMode) {
    agent.value = name || 'Agent'; storage.set('agent', agent.value);
    mode.value = chosenMode;
    world.value = newWorld();
    const escs = DATA.SCENARIOS.filter(s => s.escalate), fix = DATA.SCENARIOS.filter(s => !s.escalate);
    let d = shuffle([...shuffle([...escs]).slice(0, 2), ...shuffle([...fix]).slice(0, SHIFT_SIZE - 2)]);
    // ?s=<scenario id> puts a specific scenario first (linked from the landing page)
    const picked = DATA.SCENARIOS.find(s => s.id === new URLSearchParams(location.search).get('s'));
    if (picked) d = [picked, ...d.filter(s => s !== picked)].slice(0, SHIFT_SIZE);
    deck.value = d.map(markRaw);
    tickets.value = []; activeId.value = null;
    score.value = 0; closed.value = 0; correct.value = 0; xpGained.value = 0; csat.value = []; elapsed.value = 0;
    session.value = null; firstTicket = true;
    Object.assign(ui, { tab: 'dir', selUser: null, dirQ: '', mailView: 'box', mailUser: null, mailQ: '', mailGroup: null, traceQ: '', traceOpen: null, devSel: null, devQ: '', netView: 'overview', appView: 'onedrive', progress: null });
    modals.start = false;
    paused.value = false; running.value = true;
    nextSpawn = 8;
    spawn(); setTimeout(spawn, 1200);
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    beep('good');
  }

  function tick() {
    if (paused.value || !running.value) return;
    elapsed.value++;
    openTickets.value.forEach(t => {
      // a user in a meeting comes back and answers everything that was asked
      if (t.away && elapsed.value >= t.awayUntil) userReturns(t);
      if (!timed.value || t.state === 'Awaiting user') return; // "Awaiting user" pauses the SLA
      t.slaLeft--;
      if (t.slaLeft <= 0 && !t.breached) {
        t.breached = true;
        toast(`${t.id} breached its SLA`, 'bad'); beep('bad');
      }
    });
    if (deck.value.length && (elapsed.value >= nextSpawn || openTickets.value.length === 0)) spawn();
  }

  function spawn() {
    if (!deck.value.length) return;
    const sc = deck.value.shift();
    sc.setup(world.value);
    const away = !firstTicket && sc.priority !== 'P1' && Math.random() < AWAY_CHANCE;
    firstTicket = false;
    const t = reactive({
      id: 'INC-' + (++seq), sc: markRaw(sc), status: 'open', state: 'New', created: elapsed.value,
      slaTotal: SLA[sc.priority], slaLeft: SLA[sc.priority], breached: false,
      asked: new Set(), chat: [{ from: 'user', text: sc.body }], log: [], notes: [], flags: [], hints: 0,
      seen: false, busy: false, fresh: true,
      away, awayUntil: away ? elapsed.value + Math.round(rand(35, 55)) : 0, pending: []
    });
    tickets.value.push(t);
    setTimeout(() => { t.fresh = false; }, 800);
    nextSpawn = elapsed.value + SPAWN_EVERY;
    toast(`New ticket ${t.id} · ${sc.title}`, 'info'); beep('ticket');
    if (!activeId.value) openTicket(t.id);
  }

  function openTicket(id) {
    activeId.value = id;
    const t = activeTicket.value;
    if (t) { t.seen = true; if (t.state === 'New') t.state = 'In progress'; }
  }

  /* ---------- chat ---------- */
  async function ask(t, key, freeText) {
    if (t.busy) return;
    const q = QUESTIONS.find(x => x.k === key);
    t.chat.push({ from: 'agent', text: freeText || q.label });
    if (key) t.asked.add(key);
    if (t.away) {
      // the question waits until the user is back from their meeting
      t.pending.push(key);
      if (t.pending.length === 1) t.chat.push({ from: 'sys', text: `Delivered. ${firstName(t)} is in a meeting and will reply later. You can set the ticket to "Awaiting user" and work on another one.` });
      return;
    }
    t.busy = true;
    await sleep(rand(700, 1500));
    t.busy = false;
    reply(t, key);
  }

  function reply(t, key) {
    t.chat.push({ from: 'user', text: answerFor(t, key) });
    if (key === 'computer' && t.sc.host) t.chat.push({ from: 'sys', text: `Device noted: ${t.sc.host}. You can connect from Remote, Terminal or Devices.` });
    beep('msg');
  }

  function userReturns(t) {
    t.away = false;
    const keys = t.pending.splice(0);
    keys.forEach(k => reply(t, k));
    if (t.state === 'Awaiting user') {
      t.state = 'In progress';
      toast(`${firstName(t)} replied on ${t.id}. Status is back to In progress.`, 'info');
    } else if (keys.length) toast(`${firstName(t)} replied on ${t.id}`, 'info');
  }

  function answerFor(t, key) {
    const sc = t.sc;
    if (key === 'retry') {
      if (sc.escalate) return 'Still the same… are you passing this to another team?';
      return sc.check(world.value) ? 'Eh, it works now! Terima kasih banyak-banyak 🙏' : 'Hmm, still the same problem leh.';
    }
    if (key && sc.answers[key]) return typeof sc.answers[key] === 'function' ? sc.answers[key](world.value) : sc.answers[key];
    if (key === 'verify') return `Sure, it's ${world.value.users[sc.user].empId}.`;
    return ["Sorry ah, I'm not very technical — what do you need me to do?", 'Hmm, not sure. Can you ask in a simpler way?', "Erm… I don't know. Is that important?"][Math.floor(Math.random() * 3)];
  }

  // what the user is called in chat ("Wei Ming", not "Tan")
  const firstName = t => { const u = world.value.users[t.sc.user]; return u.callName || u.name.split(' ')[0]; };

  function showHint(t) {
    t.hints++;
    t.chat.push({ from: 'sys', label: 'Senior tech', text: t.sc.hint });
    beep('click');
  }

  // internal notes are for the team only: the user never sees them
  function addNote(t, text) {
    t.notes.push({ at: elapsed.value, text });
    t.chat.push({ from: 'note', text });
    beep('click');
  }

  function setState(t, state) {
    if (t.state === state) return;
    if (state === 'Awaiting user' && !t.away && !t.pending.length) {
      addFlag(t, 'slapause', 'Paused the SLA while the user was available', -15);
    }
    t.state = state;
    toast(`${t.id} is now ${state}${state === 'Awaiting user' ? '. SLA paused.' : ''}`, 'info');
  }

  /* ---------- action logging (used by every tool) ---------- */
  function addFlag(t, key, label, pts) {
    if (t.flags.some(f => f.key === key)) return;
    t.flags.push({ key, label, pts });
    toast(label, pts <= -100 ? 'bad' : 'warn');
    beep('bad');
    ui.shake++;
  }

  // records an action on the open ticket and applies penalties:
  // wrong person, unverified sensitive change, harmful or forbidden actions
  function act(kind, text, { user = null, sensitive = false, harmful = null } = {}) {
    const t = activeTicket.value;
    if (!t) { toast('Tip: open a ticket first so your work gets logged.', 'info'); return; }
    t.log.push({ at: elapsed.value, text });
    const mine = user && targetsOf(t.sc).includes(user);
    if (user && !mine) {
      const otherOpen = openTickets.value.some(o => targetsOf(o.sc).includes(user));
      if (!otherOpen) addFlag(t, 'wrong-' + user, `Acted on someone outside this ticket (${uname(user)})`, -40);
    }
    if (sensitive && mine) {
      if (t.sc.verifyFails) addFlag(t, 'compromised', 'Gave access to an unverified caller — account takeover!', -150);
      else if (!t.asked.has('verify')) addFlag(t, 'noverify', 'Sensitive change without verifying identity', -40);
    }
    if (harmful) addFlag(t, harmful.key, harmful.label, harmful.pts);
    if (t.sc.avoid && t.sc.avoid[kind] && mine) addFlag(t, 'avoid-' + kind, t.sc.avoid[kind].label, t.sc.avoid[kind].pts);
    if (t.sc.forbid && t.sc.forbid[kind]) addFlag(t, 'forbid-' + kind, t.sc.forbid[kind].label, t.sc.forbid[kind].pts);
  }

  /* ---------- closing & grading ---------- */
  function openClose(t) { closing.value = t; paused.value = true; modals.close = true; }
  function cancelClose() { modals.close = false; paused.value = false; }

  function grade(t, action, team, note) {
    const sc = t.sc, W = world.value, lines = [];
    let ok = false;
    if (action === 'resolve') {
      if (sc.escalate) lines.push([`Should have been escalated to ${sc.escalate}`, -60]);
      else if (sc.check(W)) { ok = true; lines.push(['Issue fixed', 100]); }
      else lines.push(['Closed without fixing — user reopened the ticket', -50]);
    } else {
      if (sc.escalate === team) { ok = true; lines.push([`Correct escalation to ${team}`, 100]); }
      else if (sc.escalate) lines.push([`Wrong team — this belongs to ${sc.escalate}`, -30]);
      else lines.push([`${team} bounced it back: this is an L1 fix`, -40]);
    }
    if (ok) {
      const rel = (sc.relevant || []).filter(k => t.asked.has(k)).length;
      if (rel) lines.push([`Asked the right questions (${rel})`, rel * 5]);
      if (timed.value && !t.breached) { const b = Math.round(30 * t.slaLeft / t.slaTotal); if (b > 0) lines.push(['Speed bonus', b]); }
      if (action === 'resolve' && t.asked.has('retry')) lines.push(['Confirmed the fix with the user', 10]);
      if (sc.bonus && sc.bonus.check(W)) lines.push([sc.bonus.label, sc.bonus.pts]);
    }
    if (note.trim().length >= 20) lines.push(['Clear resolution notes', 10]);
    else lines.push(['Missing / thin ticket notes', -5]);
    if (t.notes.some(n => n.text.trim().length >= 15)) lines.push(['Documented the work in internal notes', 5]);
    // a temporary password must be set to change at next sign-in
    targetsOf(sc).forEach(k => {
      const u = W.users[k];
      if (u && u.pwdReset && !u.mustChange) lines.push([`Temporary password for ${u.name.split(' ')[0]} not set to change at next sign-in`, -10]);
    });
    if (t.breached) lines.push(['SLA breached', -25]);
    if (t.hints && mode.value === 'standard') lines.push([`Hints used (${t.hints})`, -10 * t.hints]);
    t.flags.forEach(f => lines.push([f.label, f.pts]));
    let pts = lines.reduce((s, l) => s + l[1], 0);
    if (expert.value && pts > 0) { const bonus = Math.round(pts * 0.25); lines.push(['Expert mode bonus (+25%)', bonus]); pts += bonus; }
    let stars = ok ? 5 : 1;
    if (ok) { if (t.breached) stars--; stars -= Math.min(2, t.flags.length); if (!t.asked.size) stars--; }
    stars = Math.max(1, Math.min(5, stars));
    return { correct: ok, lines, pts, stars };
  }

  function closeTicket(action, team, note) {
    const t = closing.value; if (!t) return;
    const r = grade(t, action, team, note);
    t.status = 'closed';
    closed.value++; if (r.correct) correct.value++;
    score.value += r.pts; csat.value.push(r.stars);
    const before = levelOf(xp.value), gain = Math.max(0, r.pts);
    xp.value += gain; xpGained.value += gain;
    storage.set('xp', xp.value);
    modals.close = false;
    const h = session.value && world.value.hosts[session.value.host];
    if (h && h.owner === t.sc.user) session.value = null;
    activeId.value = null;
    result.value = { ...r, sc: t.sc };
    pendingLevel = levelOf(xp.value) > before;
    modals.result = true;
    ui.scoreBump++;
    if (r.correct) { beep('good'); confetti(r.stars >= 5 ? 160 : 70); } else beep('bad');
    const s = document.getElementById('score');
    if (s) { const rect = s.getBoundingClientRect(); floatText((r.pts >= 0 ? '+' : '') + r.pts, rect.left, rect.bottom, r.pts >= 0 ? 'pos' : 'neg'); }
    const next = openTickets.value[0];
    if (next) openTicket(next.id);
  }

  function afterResult() {
    modals.result = false;
    if (pendingLevel) {
      pendingLevel = false;
      modals.level = true; beep('level'); confetti(220);
      return;
    }
    resumeOrEnd();
  }
  function afterLevel() { modals.level = false; resumeOrEnd(); }

  function resumeOrEnd() {
    if (closed.value >= SHIFT_SIZE) return endShift();
    paused.value = false;
    if (!openTickets.value.length && deck.value.length) spawn();
  }

  function endShift() {
    running.value = false; paused.value = true; clearInterval(timer);
    const ratio = correct.value / SHIFT_SIZE;
    const g = ratio === 1 && avgCsat.value >= 4.5 ? 'S' : ratio >= .85 ? 'A' : ratio >= .7 ? 'B' : ratio >= .5 ? 'C' : 'D';
    const newBest = score.value > best.value;
    if (newBest) { best.value = score.value; storage.set('best', best.value); }
    endStats.value = { grade: g, newBest };
    modals.end = true;
    const good = ['S', 'A', 'B'].includes(g);
    confetti(good ? 200 : 60); beep(good ? 'level' : 'click');
  }

  function newShift() { modals.end = false; modals.start = true; }
  function toggleMute() { muted.value = !muted.value; storage.set('muted', muted.value); }

  return {
    // state
    agent, xp, best, muted, mode, world, deck, tickets, activeId, score, closed, correct, xpGained, csat, elapsed,
    paused, running, session, ui, modals, closing, result, endStats, monitor,
    // derived
    timed, expert, level, openTickets, activeTicket, avgCsat,
    // actions
    uname, startShift, openTicket, ask, showHint, addNote, setState, act, addFlag,
    openClose, cancelClose, closeTicket, afterResult, afterLevel, newShift, toggleMute
  };
});
