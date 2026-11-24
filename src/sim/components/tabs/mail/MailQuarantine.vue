<script setup>
import { computed } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps, mailAddr } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const items = computed(() => [...g.world.mail.quarantine].reverse());
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div v-if="!items.length" class="empty-mini">Quarantine is empty.</div>
  <div v-for="q in items" :key="q.id" class="qmsg" :class="q.state">
    <div class="qtop"><span class="st" :class="q.malicious ? 'bad' : 'warn'">{{ q.reason }}</span><small class="muted mono">{{ q.time }}</small></div>
    <b>{{ q.subject }}</b>
    <small class="mono">From {{ q.from }}</small>
    <small class="mono">To {{ mailAddr(q.to) }}</small>
    <details><summary>Details</summary><small>{{ q.detail }}</small></details>
    <div v-if="q.state === 'held'" class="row">
      <button class="btn xs" :data-rel="q.id" @click="run(ops.qRelease(q.id))">Release to inbox</button>
      <button class="btn xs ghost" :data-del="q.id" @click="run(ops.qDelete(q.id))">Delete</button>
    </div>
    <span v-else class="st" :class="{ ok: q.state === 'released' }">{{ q.state === 'released' ? 'Released' : 'Deleted' }}</span>
  </div>
</template>
