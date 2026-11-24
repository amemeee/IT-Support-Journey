<script setup>
// Bar that fills over the duration of a running remote action.
import { ref, watch, nextTick } from 'vue';
import { useGame } from '../stores/game.js';

const g = useGame();
const width = ref('0%');
const transition = ref('none');
watch(() => g.ui.progress, async p => {
  if (!p) return;
  transition.value = 'none'; width.value = '0%';
  await nextTick();
  requestAnimationFrame(() => { transition.value = `width ${p.ms}ms cubic-bezier(.4,.1,.3,1)`; width.value = '100%'; });
});
</script>

<template>
  <div id="opProg" class="progress" :class="{ hidden: !g.ui.progress }">
    <div class="bar"><span :style="{ width, transition }"></span></div>
    <small id="opText">{{ g.ui.progress && g.ui.progress.label }}</small>
  </div>
</template>
