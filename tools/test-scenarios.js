/*
 * Scenario validator — run with:  node tools/test-scenarios.js
 *
 * Loads every scenario file the simulator loads (in the same order as
 * sim.html) and checks each scenario's data and logic:
 *   - required fields, unique ids, valid priority / team / KB article
 *   - the requester, targets, device and avatar keys exist
 *   - "fix" tickets: broken after setup(), fixed after solve()
 *   - "escalate" tickets: never count as fixed
 * Exits with code 1 if anything fails.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'sim.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/scenarios[^"]*\.js)"><\/script>/g)].map(m => m[1]);

const ctx = { Math, JSON, console };
ctx.window = ctx;
vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));

const clone = o => JSON.parse(JSON.stringify(o));
const newWorld = () => ({ users: clone(ctx.DIRECTORY), hosts: clone(ctx.HOSTS), mail: clone(ctx.MAIL || {}), devices: clone(ctx.DEVICES || {}), traced: [], outage: false });

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const ANSWER_KEYS = ['error', 'when', 'restart', 'computer', 'others', 'verify'];
const kbIds = new Set(ctx.KB.map(k => k.id));
const seen = new Set();
let failures = 0;

for (const sc of ctx.SCENARIOS) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };

  for (const f of ['id', 'title', 'category', 'priority', 'user', 'body', 'setup', 'check', 'answers', 'hint', 'lesson', 'kb']) need(sc[f] !== undefined, `missing "${f}"`);
  need(!seen.has(sc.id), 'duplicate id'); seen.add(sc.id);
  need(PRIORITIES.includes(sc.priority), `bad priority ${sc.priority}`);
  need(ctx.DIRECTORY[sc.user], `unknown user ${sc.user}`);
  (sc.targets || []).forEach(t => need(ctx.DIRECTORY[t], `unknown target ${t}`));
  if (sc.host) need(ctx.HOSTS[sc.host] || (ctx.DEVICES && ctx.DEVICES[sc.host]), `unknown host/device ${sc.host}`);
  need(kbIds.has(sc.kb), `unknown KB article ${sc.kb}`);
  Object.keys(sc.answers || {}).forEach(k => need(ANSWER_KEYS.includes(k), `unknown answer key ${k}`));
  (sc.relevant || []).forEach(k => need(sc.answers && sc.answers[k], `relevant question "${k}" has no answer`));
  if (sc.escalate) need(ctx.TEAMS.includes(sc.escalate), `unknown team ${sc.escalate}`);
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

const fixes = ctx.SCENARIOS.filter(s => !s.escalate).length;
console.log(`\n${ctx.SCENARIOS.length} scenarios (${fixes} fix, ${ctx.SCENARIOS.length - fixes} escalate) from ${files.length} files, ${ctx.KB.length} KB articles`);
console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
