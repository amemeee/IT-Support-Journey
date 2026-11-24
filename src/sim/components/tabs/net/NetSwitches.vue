<script setup>
import { computed, ref, watch } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const ids = computed(() => Object.keys(g.world.net.switches));
const sel = ref('SW-L12-CORE');
const sw = computed(() => g.world.net.switches[sel.value]);
const confirmReboot = ref(false);
watch(sel, () => { confirmReboot.value = false; });
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); confirmReboot.value = false; }
const portCls = s => (s === 'up' ? 'ok' : s === 'shutdown' ? 'bad' : '');
</script>

<template>
  <label class="field"><span>Switch</span>
    <select id="swPick" v-model="sel"><option v-for="id in ids" :key="id" :value="id">{{ id }} · {{ g.world.net.switches[id].location }}</option></select>
  </label>
  <div class="u-card">
    <div class="svc"><span>Status</span><span class="st" :class="sw.status === 'Online' ? 'ok' : 'bad'">{{ sw.status }}</span></div>
    <h4 class="mh">Ports</h4>
    <div v-for="p in sw.ports" :key="p.id" class="port">
      <div class="port-main">
        <b class="mono">{{ p.id }}</b> <span class="st" :class="portCls(p.status)">{{ p.status }}</span>
        <small>{{ p.desc }} · VLAN {{ p.vlan }}</small>
        <small v-if="p.mac" class="mono muted">{{ p.mac }} · {{ p.vendor }}</small>
      </div>
      <button v-if="p.status === 'shutdown'" class="btn xs" :data-port-on="p.id" @click="run(ops.portSet(sel, p.id, true))">Enable</button>
      <button v-else class="btn xs" :data-port-off="p.id" @click="run(ops.portSet(sel, p.id, false))">Shut down</button>
    </div>
    <button id="swReboot" class="btn sm danger-o" @click="confirmReboot = true">Reboot switch…</button>
    <div v-if="confirmReboot" class="reset-box pop">
      <b>Reboot {{ sel }}?</b>
      <span class="muted">Every device on this switch loses its network for about 5 minutes.</span>
      <div class="row">
        <button id="swRebootGo" class="btn xs primary" @click="run(ops.switchReboot(sel))">Reboot</button>
        <button class="btn xs ghost" @click="confirmReboot = false">Cancel</button>
      </div>
    </div>
  </div>
</template>
