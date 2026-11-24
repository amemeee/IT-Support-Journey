<script setup>
import { computed, ref, watch } from 'vue';
import { useGame } from '../../stores/game.js';
import Modal from '../Modal.vue';
import Avatar from '../Avatar.vue';

const g = useGame();
const r = computed(() => g.result);
const shown = ref('0');

// count the total up from 0 when the dialog opens
watch(() => g.modals.result, open => {
  if (!open || !r.value) return;
  const to = r.value.pts, start = performance.now();
  const step = now => {
    const p = Math.min(1, (now - start) / 900);
    shown.value = (to >= 0 ? '+' : '') + Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
</script>

<template>
  <Modal id="resultModal" :show="g.modals.result" :card-class="['result', r && (r.correct ? 'win' : 'lose')]">
    <template v-if="r">
      <div id="resIco" class="res-ico">{{ r.correct ? 'Correct' : 'Incorrect' }}</div>
      <h3 id="resTitle">{{ r.correct ? 'Ticket handled correctly' : 'Ticket handled incorrectly' }}</h3>
      <div id="resStars" class="stars">
        <span v-for="i in 5" :key="i" :class="{ on: i <= r.stars }" :style="{ animationDelay: (.3 + i * .12) + 's' }">★</span>
      </div>
      <div id="resLines" class="res-lines">
        <div v-for="(l, i) in r.lines" :key="i" class="line" :style="{ animationDelay: (.2 + i * .12) + 's' }">
          <span>{{ l[0] }}</span><b :class="l[1] >= 0 ? 'pos' : 'neg'">{{ l[1] >= 0 ? '+' : '' }}{{ l[1] }}</b>
        </div>
      </div>
      <div class="res-total"><span>Total</span><b id="resTotal">{{ shown }}</b></div>
      <div id="resReveal">
        <div v-if="r.sc.reveal" class="reveal-card">
          <Avatar :who="r.sc.reveal.key" :name="r.sc.reveal.name" size="lg" />
          <div><small>Behind this ticket</small><b>{{ r.sc.reveal.name }}</b><p>{{ r.sc.reveal.text }}</p></div>
        </div>
      </div>
      <div id="resLesson" class="lesson"><b>Lesson</b><p>{{ r.sc.lesson }}</p></div>
      <div id="resReal" class="lesson real"><b>On the job</b><p>{{ r.sc.realWorld }}</p></div>
      <button id="nextBtn" class="btn primary" @click="g.afterResult()">Next ticket →</button>
    </template>
  </Modal>
</template>
