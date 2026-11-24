<script setup>
import { useGame } from '../stores/game.js';
import { beep } from '../lib/fx.js';

const g = useGame();

function slaPct(t) { return g.timed ? Math.max(0, t.slaLeft / t.slaTotal * 100) : 100; }
function slaClass(t) {
  if (t.state === 'Awaiting user') return 'paused';
  const p = slaPct(t);
  return p < 25 ? 'crit' : p < 50 ? 'warn' : '';
}
function open(t) {
  beep('click');
  g.openTicket(t.id);
  if (innerWidth < 1000) document.getElementById('ticketPane')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <aside class="panel queue">
    <div class="panel-head"><h3>Ticket queue</h3><span id="queueCount" class="badge">{{ g.openTickets.length }}</span></div>
    <div id="queueList" class="queue-list">
      <div v-if="!g.openTickets.length" class="empty-mini">{{ g.deck.length ? 'Queue empty. Next ticket soon.' : 'All caught up.' }}</div>
      <button
        v-for="t in g.openTickets" :key="t.id"
        class="q-card" :class="{ active: t.id === g.activeId, new: t.fresh, unseen: !t.seen }"
        :data-id="t.id" @click="open(t)"
      >
        <div class="q-top">
          <span class="prio" :class="t.sc.priority">{{ t.sc.priority }}</span>
          <span class="q-id">{{ t.id }}</span>
          <span class="q-cat">{{ t.sc.category }}</span>
        </div>
        <div class="q-title">{{ t.sc.title }}</div>
        <div class="q-user">{{ g.uname(t.sc.user) }} · {{ t.state }}</div>
        <div class="sla" :class="slaClass(t)"><span :style="{ width: slaPct(t) + '%' }"></span></div>
      </button>
    </div>
  </aside>
</template>
