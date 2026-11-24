/* Terminal output buffer. Kept separate so both the terminal and the
   admin actions (e.g. connecting to a PC) can print to it. */
import { reactive } from 'vue';
import { sleep } from './util.js';

export const term = reactive({ lines: [], hist: [], hi: 0, busy: false });
let id = 0;

export function termPrint(lines, cls = '') {
  lines.forEach(text => term.lines.push({ id: ++id, text, cls }));
  if (term.lines.length > 600) term.lines.splice(0, term.lines.length - 600);
}

export async function termSlow(lines, cls = '', delay = 380) {
  for (const l of lines) { termPrint([l], cls); await sleep(delay); }
}

export function termClear() { term.lines.splice(0); }

export function termReset() {
  termClear();
  termPrint(['IT Support Journey Remote Shell [Version 3.0]', 'Type "help" for available commands.', ''], 'muted');
}
