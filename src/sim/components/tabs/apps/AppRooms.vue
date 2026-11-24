<script setup>
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div v-for="(r, name) in g.world.apps.rooms" :key="name" class="u-card">
    <div class="host-head"><b>{{ name }}</b><small class="muted">{{ r.capacity }} people</small></div>
    <div class="svc">
      <span>Auto-accept bookings<br><small class="muted mono">AutomateProcessing {{ r.autoAccept ? 'AutoAccept' : 'AutoUpdate' }}</small></span>
      <span class="st" :class="r.autoAccept ? 'ok' : 'bad'">{{ r.autoAccept ? 'On' : 'Off' }}</span>
      <button class="btn xs" :data-room-auto="name" @click="run(ops.roomSet(name, !r.autoAccept, r.allowConflicts))">{{ r.autoAccept ? 'Turn off' : 'Turn on' }}</button>
    </div>
    <div class="svc">
      <span>Allow double bookings<br><small class="muted mono">AllowConflicts {{ r.allowConflicts ? '$true' : '$false' }}</small></span>
      <span class="st" :class="r.allowConflicts ? 'bad' : 'ok'">{{ r.allowConflicts ? 'Yes' : 'No' }}</span>
      <button class="btn xs" :data-room-conf="name" @click="run(ops.roomSet(name, r.autoAccept, !r.allowConflicts))">{{ r.allowConflicts ? 'Decline conflicts' : 'Allow conflicts' }}</button>
    </div>
  </div>
</template>
