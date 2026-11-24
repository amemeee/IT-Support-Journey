<script setup>
import { computed } from 'vue';
import { useGame } from '../../../stores/game.js';

const g = useGame();
const N = computed(() => g.world.net);
const ok = s => /^(Online|Up)$/.test(s);
</script>

<template>
  <div class="u-card">
    <h4 class="mh">Internet line</h4>
    <div class="svc"><span>{{ N.wan.isp }}</span><span class="st" :class="ok(N.wan.status) ? 'ok' : 'bad'">{{ N.wan.status }}</span></div>
    <div class="kv"><span>Usage right now</span><b>{{ N.wan.utilisation }}%</b></div>
    <div class="meter" :class="N.wan.utilisation >= 90 ? 'crit' : N.wan.utilisation >= 75 ? 'warn' : ''"><span :style="{ width: N.wan.utilisation + '%' }"></span></div>
    <div class="svc"><span>Firewall {{ N.firewall.name }}</span><span class="st" :class="ok(N.firewall.status) ? 'ok' : 'bad'">{{ N.firewall.status }}</span></div>

    <h4 class="mh">Switches</h4>
    <div v-for="(sw, id) in N.switches" :key="id" class="svc">
      <span class="mono">{{ id }}<br><small class="muted">{{ sw.location }}</small></span>
      <span class="st" :class="ok(sw.status) ? 'ok' : 'bad'">{{ sw.status }}</span>
    </div>

    <h4 class="mh">Power (UPS)</h4>
    <div v-for="(st, id) in N.ups" :key="id" class="svc"><span class="mono">{{ id }}</span><span class="st" :class="ok(st) ? 'ok' : 'bad'">{{ st }}</span></div>

    <h4 class="mh">Site-to-site VPN</h4>
    <div v-for="t in N.tunnels" :key="t.name" class="svc">
      <span>{{ t.name }}<br><small class="muted">{{ t.detail }}</small></span>
      <span class="st" :class="ok(t.status) ? 'ok' : 'bad'">{{ t.status }}</span>
    </div>

    <h4 class="mh">Wi-Fi access points</h4>
    <div v-for="(ap, id) in N.aps" :key="id" class="svc">
      <span class="mono">{{ id }}<br><small class="muted">{{ ap.location }}</small></span>
      <span class="st" :class="ok(ap.status) ? 'ok' : 'bad'">{{ ap.status }}</span>
    </div>
  </div>
</template>
