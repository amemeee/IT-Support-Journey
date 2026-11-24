<script setup>
import { computed, ref } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const N = computed(() => g.world.net);
const voucherFor = ref('');
const busy = computed(() => !!g.ui.progress);
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div class="u-card">
    <h4 class="mh">Networks</h4>
    <div class="svc">
      <span>{{ N.wifi.staffSsid }}<br><small class="muted">Staff · WPA2-Enterprise / PSK</small></span>
      <code v-if="N.wifi.pskRevealed" class="mono">{{ N.wifi.staffPsk }}</code>
      <button v-else id="pskShow" class="btn xs danger-o" @click="run(ops.revealPsk())">Show password</button>
    </div>
    <div class="svc"><span>{{ N.wifi.guestSsid }}<br><small class="muted">Guest · internet only, isolated from staff network</small></span></div>
    <div class="add-grp row">
      <input id="voucherFor" v-model="voucherFor" class="search" placeholder="Who is it for? e.g. Visitor from the bank">
      <button id="voucherGo" class="btn xs" @click="run(ops.guestVoucher(voucherFor.trim())); voucherFor = ''">Create guest voucher</button>
    </div>
    <div v-for="v in N.wifi.vouchers" :key="v.code" class="svc"><span class="mono">{{ v.code }}</span><small class="muted">{{ v.for }} · {{ v.valid }}</small></div>
  </div>

  <div v-for="(ap, id) in N.aps" :key="id" class="u-card">
    <div class="host-head">
      <div><b class="mono">{{ id }}</b><br><small class="muted">{{ ap.location }}</small></div>
      <span class="st" :class="ap.status === 'Online' ? 'ok' : 'bad'">{{ ap.status }}</span>
    </div>
    <div class="kv"><span>Clients</span><b>{{ ap.clients }}</b></div>
    <div class="kv"><span>Channels</span><b class="mono">2.4 GHz ch {{ ap.ch24 }} · 5 GHz ch {{ ap.ch5 }}</b></div>
    <div class="kv"><span>2.4 GHz busy</span><b>{{ ap.util24 }}%{{ ap.util24 >= 80 ? ' (interference)' : '' }}</b></div>
    <div class="meter" :class="ap.util24 >= 80 ? 'crit' : ap.util24 >= 60 ? 'warn' : ''"><span :style="{ width: ap.util24 + '%' }"></span></div>
    <div class="svc">
      <span>Band steering (prefer 5 GHz)</span>
      <span class="st" :class="ap.bandSteering ? 'ok' : 'warn'">{{ ap.bandSteering ? 'On' : 'Off' }}</span>
      <button class="btn xs" :data-steer="id" @click="run(ops.bandSteering(id, !ap.bandSteering))">{{ ap.bandSteering ? 'Turn off' : 'Turn on' }}</button>
    </div>
    <button class="btn sm" :data-apreboot="id" :disabled="busy" @click="ops.apReboot(id)">Reboot access point</button>
  </div>
  <div v-if="g.ui.progress" class="progress"><small>{{ g.ui.progress.label }}</small></div>
</template>
