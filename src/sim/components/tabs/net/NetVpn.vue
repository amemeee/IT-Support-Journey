<script setup>
import { computed } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const V = computed(() => g.world.net.vpn);
const PROTOCOLS = ['IKEv2 (UDP 500/4500)', 'SSL (TCP 443)'];
function setProto(k, proto) { const r = ops.vpnProfile(k, proto); toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div class="u-card">
    <div class="svc"><span>VPN gateway</span><span class="st" :class="V.gateway === 'Online' ? 'ok' : 'bad'">{{ V.gateway }}</span></div>
    <h4 class="mh">User VPN profiles</h4>
    <div v-for="(proto, k) in V.profiles" :key="k" class="svc">
      <span>{{ g.uname(k) }}</span>
      <select :data-vpn="k" :value="proto" @change="setProto(k, $event.target.value)">
        <option v-for="p in PROTOCOLS" :key="p">{{ p }}</option>
      </select>
    </div>
    <h4 class="mh">Failed sign-ins (last 24 hours)</h4>
    <div v-for="f in V.failedLogins" :key="f.user" class="svc fwd">
      <span><b>{{ g.uname(f.user) }}</b>: {{ f.count }} failed attempts<br><small class="muted">{{ f.when }} · from {{ f.from }}</small></span>
    </div>
    <div v-if="!V.failedLogins.length" class="muted sm-t">Nothing unusual.</div>
    <h4 class="mh">Site-to-site tunnels</h4>
    <div v-for="t in g.world.net.tunnels" :key="t.name" class="svc">
      <span>{{ t.name }}<br><small class="muted">{{ t.detail }}</small></span>
      <span class="st" :class="t.status === 'Up' ? 'ok' : 'bad'">{{ t.status }}</span>
    </div>
  </div>
</template>
