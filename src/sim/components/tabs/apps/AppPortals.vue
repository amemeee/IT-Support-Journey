<script setup>
import { onMounted } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';

const g = useGame();
const ops = useOps();
// reading this list counts as finding out who manages a portal
onMounted(() => ops.markPortals());
</script>

<template>
  <p class="muted sm-t" style="margin:0">External portals the company uses, and who manages access to each. IT does not hold admin rights for these.</p>
  <div v-for="p in g.world.apps.portals" :key="p.name" class="u-card">
    <b>{{ p.name }}</b>
    <div class="kv"><span>Managed by</span><b>{{ p.owner }}</b></div>
    <small class="muted">{{ p.how }}</small>
  </div>
</template>
