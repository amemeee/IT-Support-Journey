<script setup>
import { computed } from 'vue';
import { useGame } from '../../stores/game.js';
import { useOps } from '../../stores/ops.js';
import CctvFeed from '../CctvFeed.vue';
import ProgressBar from '../ProgressBar.vue';

const props = defineProps({ host: String, h: Object });
const g = useGame();
const ops = useOps();
const busy = computed(() => !!g.ui.progress);
const diskCls = computed(() => (props.h.disk >= 90 ? 'crit' : props.h.disk >= 75 ? 'warn' : ''));
const status = c => (c.status === 'Online' ? ['ok', 'Online'] : c.status === 'Booting' ? ['warn', 'Connecting…'] : ['bad', 'No signal']);
</script>

<template>
  <div class="host pop">
    <div class="host-head">
      <div><span class="pulse-dot"></span><b class="mono">{{ host }}</b> <span class="st ok">NVR</span></div>
      <button id="disc" class="btn xs ghost" @click="ops.disconnect()">Disconnect</button>
    </div>
    <div class="kv"><span>Device</span><b>{{ h.os }}</b></div>
    <div class="kv"><span>IPv4</span><b class="mono">{{ h.ip }}</b></div>
    <div class="kv"><span>Recording storage</span><b>{{ h.disk }}%</b></div>
    <div class="meter" :class="diskCls"><span :style="{ width: h.disk + '%' }"></span></div>

    <h4>Live view</h4>
    <div class="feeds">
      <button v-for="(c, i) in h.cams" :key="c.id" class="feed-tile" :data-cam="i" title="Open on monitor" @click="ops.openMonitor(host, i)">
        <CctvFeed :host="host" :index="i" :width="320" :height="180" />
      </button>
    </div>
    <button id="monOpen" class="btn sm" @click="ops.openMonitor(host)">Open monitor</button>

    <h4>Cameras</h4>
    <div v-for="(c, i) in h.cams" :key="c.id" class="svc">
      <span>{{ c.name }}<br><small class="mono muted">{{ c.ip }} · PoE port {{ c.port }}</small></span>
      <span class="st" :class="status(c)[0]">{{ status(c)[1] }}</span>
      <button class="btn xs" :data-poe="i" :disabled="busy" @click="ops.poe(i)">Power-cycle port</button>
    </div>

    <h4>Footage</h4>
    <div class="ops"><button class="btn sm danger-o" data-op="export" :disabled="busy" @click="ops.exportFootage()">Export footage…</button></div>
    <p class="muted" style="font-size:12px;margin:0">Footage of people is personal data under the PDPA.</p>
    <ProgressBar />
  </div>
</template>
