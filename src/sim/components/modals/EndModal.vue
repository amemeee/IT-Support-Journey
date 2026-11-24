<script setup>
import { computed } from 'vue';
import { useGame, SHIFT_SIZE } from '../../stores/game.js';
import { fmt } from '../../lib/util.js';
import Modal from '../Modal.vue';

const g = useGame();
const MSG = {
  S: 'Every ticket handled correctly.',
  A: 'Nearly every ticket handled correctly.',
  B: 'Most tickets handled correctly. Review the lessons for the rest.',
  C: 'About half correct. The KB and hints cover what you missed.',
  D: 'Fewer than half correct. Training mode removes the clock.'
};
const stats = computed(() => [
  ['Score', g.score + (g.endStats && g.endStats.newBest ? ' (new best)' : '')], ['Correct', `${g.correct}/${SHIFT_SIZE}`],
  ['Avg CSAT', g.avgCsat == null ? '–' : g.avgCsat.toFixed(1) + '★'], ['Shift time', fmt(g.elapsed)],
  ['XP earned', '+' + g.xpGained], ['Best score', g.best]
]);
</script>

<template>
  <Modal id="endModal" :show="g.modals.end" card-class="end">
    <template v-if="g.endStats">
      <small class="muted">SHIFT COMPLETE</small>
      <div id="endGrade" class="grade" :class="'g-' + g.endStats.grade">{{ g.endStats.grade }}</div>
      <p id="endMsg">{{ MSG[g.endStats.grade] }}</p>
      <div id="endStats" class="end-stats">
        <div v-for="([k, v], i) in stats" :key="k" class="stat" :style="{ animationDelay: (.3 + i * .1) + 's' }"><small>{{ k }}</small><b>{{ v }}</b></div>
      </div>
      <div class="row center">
        <button id="againBtn" class="btn primary" @click="g.newShift()">New shift</button>
        <a class="btn ghost" href="index.html">Home</a>
      </div>
    </template>
  </Modal>
</template>
