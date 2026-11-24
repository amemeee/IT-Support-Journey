<script setup>
import { computed } from 'vue';
import { useGame } from '../../stores/game.js';
import { useOps } from '../../stores/ops.js';
import CctvFeed from '../CctvFeed.vue';
import Modal from '../Modal.vue';

const g = useGame();
const ops = useOps();
const h = computed(() => g.monitor.host && g.world.hosts[g.monitor.host]);
const single = computed(() => g.monitor.only !== null && g.monitor.only !== undefined);
const shown = computed(() => (h.value ? h.value.cams.map((c, i) => ({ c, i })).filter(x => !single.value || x.i === g.monitor.only) : []));
// click a camera to enlarge it; click again to go back to all four
function toggle(i) { g.monitor.only = single.value ? null : i; }
</script>

<template>
  <Modal id="cctvModal" :show="g.modals.monitor" card-class="monitor">
    <div class="mon-head">
      <div><b>Guard post monitor</b><small id="monHost" class="mono muted">{{ h ? `${g.monitor.host} · ${h.cams.length} cameras` : '' }}</small></div>
      <button id="monClose" class="btn xs ghost" @click="ops.closeMonitor()">Close</button>
    </div>
    <div id="monGrid" class="mon-grid" :class="{ single }">
      <button v-for="x in shown" :key="x.c.id" class="mon-tile" :data-cam="x.i" @click="toggle(x.i)">
        <CctvFeed v-if="g.modals.monitor" :host="g.monitor.host" :index="x.i" :width="640" :height="360" />
        <span>{{ x.c.name }}</span>
      </button>
    </div>
    <small class="muted">Click a camera to enlarge it. Click again to see all cameras.</small>
  </Modal>
</template>
