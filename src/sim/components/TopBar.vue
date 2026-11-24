<script setup>
import { computed, ref, watch } from 'vue';
import { useGame, LEVELS, SHIFT_SIZE } from '../stores/game.js';
import { fmt } from '../lib/util.js';
import Avatar from './Avatar.vue';

const g = useGame();
const cur = computed(() => LEVELS[g.level]);
const next = computed(() => LEVELS[g.level + 1]);
const pct = computed(() => (next.value ? (g.xp - cur.value.xp) / (next.value.xp - cur.value.xp) * 100 : 100));

// small bounce on the score when a ticket closes
const bump = ref(false);
watch(() => g.ui.scoreBump, () => { bump.value = false; requestAnimationFrame(() => { bump.value = true; }); });
</script>

<template>
  <header class="sim-top">
    <a class="logo" href="index.html">IT Support Journey</a>
    <div class="agent">
      <Avatar id="agentAvatar" who="agent" :name="g.agent || 'Agent'" />
      <div class="agent-txt">
        <b id="agentName">{{ g.agent || 'Agent' }}</b>
        <small id="agentLevel">Lv {{ g.level + 1 }} · {{ cur.name }}</small>
      </div>
    </div>
    <div class="xp">
      <div class="xp-bar"><span id="xpFill" :style="{ width: pct + '%' }"></span></div>
      <small id="xpText">{{ next ? `${g.xp} / ${next.xp} XP` : `${g.xp} XP · MAX` }}</small>
    </div>
    <div class="kpis">
      <div><small>Score</small><b id="score" :class="{ bump }">{{ g.score }}</b></div>
      <div><small>Closed</small><b id="closed">{{ g.closed }}/{{ SHIFT_SIZE }}</b></div>
      <div><small>CSAT</small><b id="csat">{{ g.avgCsat == null ? '–' : g.avgCsat.toFixed(1) + '★' }}</b></div>
      <div><small>Shift</small><b id="clock" class="mono">{{ fmt(g.elapsed) }}</b></div>
    </div>
    <button id="muteBtn" class="icon-btn" title="Toggle sound" aria-label="Toggle sound" @click="g.toggleMute()">
      {{ g.muted ? 'Sound off' : 'Sound on' }}
    </button>
  </header>
</template>
