<script setup>
import { computed, ref } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const D = computed(() => g.world.net.dhcp);
const prn = computed(() => g.world.net.printers);
const resName = ref('PRN-L12-01');
const resIp = ref('');
const exIp = ref('');
// a few current leases: printers plus the PCs on the network list
const leases = computed(() => [
  ...Object.entries(prn.value).map(([n, p]) => ({ n, ip: p.ip, mac: p.mac, kind: D.value.reservations.some(r => r.name === n) ? 'reserved' : 'dynamic' })),
  ...Object.entries(g.world.hosts).filter(([, h]) => h.type !== 'nvr').slice(0, 6).map(([n, h]) => ({ n, ip: h.ip, mac: '', kind: 'dynamic' }))
]);
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div class="u-card">
    <div class="kv"><span>Scope</span><b class="mono">{{ D.scope }}</b></div>
    <div class="kv"><span>Addresses in use</span><b>{{ D.used }} / {{ D.total }}</b></div>
    <div class="meter"><span :style="{ width: D.used / D.total * 100 + '%' }"></span></div>

    <h4 class="mh">Printers</h4>
    <div v-for="(p, n) in prn" :key="n" class="svc">
      <span class="mono">{{ n }}<br><small class="muted">MAC {{ p.mac }}</small></span>
      <span>Current IP <b class="mono">{{ p.ip }}</b><br><small class="muted">PCs print to {{ p.expectedIp }}</small></span>
    </div>

    <h4 class="mh">Reservations</h4>
    <div v-for="r in D.reservations" :key="r.name" class="svc"><span class="mono">{{ r.name }}</span><small class="mono muted">{{ r.mac }}</small><b class="mono">{{ r.ip }}</b></div>
    <div class="add-grp row">
      <select id="resName" v-model="resName"><option v-for="(p, n) in prn" :key="n">{{ n }}</option></select>
      <input id="resIp" v-model="resIp" class="search mono" placeholder="IP to reserve">
      <button id="resAdd" class="btn xs" @click="run(ops.dhcpReserve(resName, resIp.trim()))">Reserve</button>
    </div>

    <h4 class="mh">Exclusions <small class="muted">(never handed out)</small></h4>
    <div class="chips-row">
      <span v-for="ip in D.exclusions" :key="ip" class="grp mono">{{ ip }}</span>
      <span v-if="!D.exclusions.length" class="muted sm-t">None</span>
    </div>
    <div class="add-grp row">
      <input id="exIp" v-model="exIp" class="search mono" placeholder="e.g. 10.12.7.15">
      <button id="exAdd" class="btn xs" @click="run(ops.dhcpExclude(exIp.trim())); exIp = ''">Exclude</button>
    </div>

    <h4 class="mh">Some current leases</h4>
    <div v-for="l in leases" :key="l.n" class="svc"><span class="mono">{{ l.n }}</span><b class="mono">{{ l.ip }}</b><small class="muted">{{ l.kind }}</small></div>
  </div>
</template>
