<script setup>
// One camera feed, redrawn by the shared feed loop while it is on screen.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useGame } from '../stores/game.js';
import { addFeed, removeFeed, drawFeed } from '../lib/feedloop.js';

const props = defineProps({ host: String, index: Number, width: Number, height: Number });
const g = useGame();
const canvas = ref(null);
let feed;

onMounted(() => {
  feed = {
    canvas: canvas.value,
    frame: t => {
      const h = g.world.hosts[props.host];
      const cam = h && h.cams[props.index];
      if (cam) drawFeed(canvas.value, cam, props.index, t, g.elapsed);
    }
  };
  addFeed(feed);
});
onBeforeUnmount(() => removeFeed(feed));
</script>

<template>
  <canvas ref="canvas" class="feed" :data-host="host" :data-cam="index" :width="width" :height="height"></canvas>
</template>
