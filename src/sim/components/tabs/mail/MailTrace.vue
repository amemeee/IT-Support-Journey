<script setup>
import { computed, ref, watch } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps, mailAddr } from '../../../stores/ops.js';
import { beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const query = ref(g.ui.traceQ);
const results = computed(() => ops.findTrace(g.ui.traceQ));
// results on screen count as "looked at", which some tickets check
watch(results, r => ops.markTraced(r), { immediate: true });
const cls = s => (s === 'Delivered' ? 'ok' : s === 'Failed' ? 'bad' : 'warn');

function search() {
  g.ui.traceQ = query.value; g.ui.traceOpen = null;
  if (query.value.trim().length >= 2) g.act('trace', `Ran message trace for "${query.value.trim()}"`);
  beep('click');
}
</script>

<template>
  <form id="trForm" class="row" @submit.prevent="search">
    <input id="trQ" v-model="query" class="search" placeholder="Sender, recipient or name" autocomplete="off">
    <button class="btn sm primary">Trace</button>
  </form>
  <div class="trace">
    <div v-if="g.ui.traceQ.trim().length < 2" class="empty-mini">Search by person or address to see what happened to their email in the last 10 days.</div>
    <div v-else-if="!results.length" class="empty-mini">No messages found.</div>
    <button
      v-for="e in results" :key="e.id" class="tr" :class="{ open: g.ui.traceOpen === e.id }" :data-tr="e.id"
      @click="g.ui.traceOpen = g.ui.traceOpen === e.id ? null : e.id"
    >
      <span class="mono muted">{{ e.time }}</span>
      <span class="tr-main">
        <b>{{ e.subject }}</b>
        <small class="mono">{{ mailAddr(e.from) }} → {{ mailAddr(e.to) }}</small>
        <small v-if="g.ui.traceOpen === e.id" class="tr-detail mono">{{ e.detail }}</small>
      </span>
      <span class="st" :class="cls(e.status)">{{ e.status }}</span>
    </button>
  </div>
</template>
