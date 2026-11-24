/*
 * Scenario validator — run with:  npm run test:scenarios
 *
 * Imports the same data the simulator uses (src/data) and checks every
 * scenario's data and logic:
 *   - required fields, unique ids, valid priority / team / KB article
 *   - requester, targets and device exist; "On the job" note present
 *   - fix tickets: broken after setup(), fixed after solve()
 *   - escalation tickets: never count as fixed
 *   - forbid / bonus / answer functions are well formed
 * Exits with code 1 if anything fails.
 */
import { SCENARIOS, KB, TEAMS, DIRECTORY, HOSTS, MAIL, DEVICES, NETWORK, APPS } from '../src/data/index.js';

const clone = o => JSON.parse(JSON.stringify(o));
const newWorld = () => ({ users: clone(DIRECTORY), hosts: clone(HOSTS), mail: clone(MAIL), devices: clone(DEVICES), net: clone(NETWORK), apps: clone(APPS), traced: [], outage: false });

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const ANSWER_KEYS = ['error', 'when', 'restart', 'computer', 'others', 'verify'];
const kbIds = new Set(KB.map(k => k.id));
const seen = new Set();
let failures = 0;

for (const sc of SCENARIOS) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };

  for (const f of ['id', 'title', 'category', 'priority', 'user', 'body', 'setup', 'check', 'answers', 'hint', 'lesson', 'kb', 'realWorld']) need(sc[f] !== undefined, `missing "${f}"`);
  need(!seen.has(sc.id), 'duplicate id'); seen.add(sc.id);
  need(PRIORITIES.includes(sc.priority), `bad priority ${sc.priority}`);
  need(DIRECTORY[sc.user], `unknown user ${sc.user}`);
  (sc.targets || []).forEach(t => need(DIRECTORY[t], `unknown target ${t}`));
  if (sc.host) need(HOSTS[sc.host] || DEVICES[sc.host], `unknown host/device ${sc.host}`);
  need(kbIds.has(sc.kb), `unknown KB article ${sc.kb}`);
  Object.keys(sc.answers || {}).forEach(k => need(ANSWER_KEYS.includes(k), `unknown answer key ${k}`));
  (sc.relevant || []).forEach(k => need(sc.answers && sc.answers[k], `relevant question "${k}" has no answer`));
  if (sc.escalate) need(TEAMS.includes(sc.escalate), `unknown team ${sc.escalate}`);
  if (sc.reveal) need(sc.reveal.key && sc.reveal.text, 'reveal needs key and text');
  Object.entries(sc.answers || {}).forEach(([k, v]) => need(typeof v === 'string' || typeof v === 'function', `answer "${k}" must be text or a function`));
  Object.entries(sc.forbid || {}).forEach(([k, v]) => need(v && v.label && v.pts < 0, `forbid "${k}" needs a label and negative pts`));
  if (sc.bonus) need(typeof sc.bonus.check === 'function' && sc.bonus.label && sc.bonus.pts > 0, 'bonus needs check(), label and positive pts');

  try {
    const w = newWorld();
    sc.setup(w);
    if (sc.escalate) {
      need(!sc.check(w), 'escalation ticket counts as fixed');
    } else {
      need(typeof sc.solve === 'function', 'fix ticket has no solve()');
      // "passive" tickets are solved by NOT acting (e.g. leave the phish in quarantine)
      if (!sc.passive) need(!sc.check(w), 'already fixed right after setup()');
      if (typeof sc.solve === 'function') {
        sc.solve(w);
        need(sc.check(w), 'still broken after solve()');
      }
    }
    if (sc.bonus) sc.bonus.check(w); // must not throw
    Object.values(sc.answers || {}).forEach(v => { if (typeof v === 'function') need(typeof v(w) === 'string', 'answer function must return text'); });
  } catch (e) {
    errs.push('threw: ' + e.message);
  }

  if (errs.length) { failures++; console.log(`✗ ${sc.id}\n    ${errs.join('\n    ')}`); }
}

const fixes = SCENARIOS.filter(s => !s.escalate).length;
console.log(`\n${SCENARIOS.length} scenarios (${fixes} fix, ${SCENARIOS.length - fixes} escalate), ${KB.length} KB articles`);
console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
