<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useGame } from '../../stores/game.js';
import { useTerminal } from '../../stores/terminal.js';
import { term, termReset } from '../../lib/termout.js';

const g = useGame();
const { run, prompt } = useTerminal();
const input = ref('');
const outEl = ref(null);
const inEl = ref(null);

async function submit() {
  if (term.busy) return;
  const v = input.value; input.value = '';
  term.busy = true;
  try { await run(v); } finally { term.busy = false; }
}
// up/down arrows walk through command history
function history(dir) {
  term.hi = Math.min(term.hist.length, Math.max(0, term.hi + dir));
  input.value = term.hist[term.hi] || '';
}

watch(() => term.lines.length, async () => { await nextTick(); if (outEl.value) outEl.value.scrollTop = outEl.value.scrollHeight; });
watch(() => g.ui.tab, tab => { if (tab === 'term') setTimeout(() => inEl.value && inEl.value.focus(), 50); });
watch(() => g.running, on => { if (on) termReset(); });
onMounted(termReset);
</script>

<template>
  <div class="term">
    <div id="termOut" ref="outEl" class="term-out mono" @click="inEl && inEl.focus()">
      <div v-for="l in term.lines" :key="l.id" :class="l.cls">{{ l.text }}</div>
    </div>
    <form id="termForm" class="term-in mono" :class="{ busy: term.busy }" @submit.prevent="submit">
      <span id="termPrompt">{{ prompt() }}</span>
      <input
        id="termInput" ref="inEl" v-model="input" autocomplete="off" spellcheck="false" aria-label="Terminal input"
        @keydown.up.prevent="history(-1)" @keydown.down.prevent="history(1)"
      >
    </form>
  </div>
</template>
