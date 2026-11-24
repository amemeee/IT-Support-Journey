<script setup>
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <p class="muted sm-t" style="margin:0">Third-party apps that were given permission to company data, and who approved them.</p>
  <div v-for="a in g.world.apps.enterpriseApps" :key="a.name" class="u-card">
    <div class="host-head"><b>{{ a.name }}</b><span class="st" :class="a.publisher.startsWith('Unverified') ? 'bad' : 'ok'">{{ a.publisher.startsWith('Unverified') ? 'Unverified' : 'Verified' }}</span></div>
    <div class="kv"><span>Publisher</span><b>{{ a.publisher }}</b></div>
    <div class="kv"><span>Approved by</span><b>{{ a.consentedBy === 'admin' ? 'IT admin' : g.uname(a.consentedBy) }}</b></div>
    <small class="muted">Can: {{ a.perms }}</small>
    <button class="btn sm danger-o" :data-revoke="a.name" @click="run(ops.consentRevoke(a.name))">Revoke and remove app</button>
  </div>
</template>
