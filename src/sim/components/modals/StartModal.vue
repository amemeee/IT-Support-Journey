<script setup>
import { ref } from 'vue';
import { useGame } from '../../stores/game.js';
import { beep } from '../../lib/fx.js';
import Modal from '../Modal.vue';

const g = useGame();
const name = ref(g.agent);
const mode = ref('standard');
const MODES = [
  ['standard', 'Standard', 'SLA timers, hints cost points'],
  ['training', 'Training', 'No clock, free hints'],
  ['expert', 'Expert', 'Type everything, no hints, +25% points']
];
</script>

<template>
  <Modal id="startModal" :show="g.modals.start" tag="form" card-id="startForm" card-class="start" @submit="g.startShift(name.trim(), mode)">
    <h2>Start a shift</h2>
    <p class="muted">You are the L1 IT support agent at XYZ100 Sdn Bhd, Kuala Lumpur. This shift has 8 tickets. Fix what you can and escalate what you can't.</p>
    <label class="field"><span>Your name</span><input id="agentInput" v-model="name" maxlength="24" placeholder="e.g. Amin" autocomplete="off"></label>
    <div class="modes">
      <button
        v-for="[k, label, desc] in MODES" :key="k" type="button" class="mode-opt" :class="{ active: mode === k }" :data-mode="k"
        @click="mode = k; beep('click')"
      ><b>{{ label }}</b><small>{{ desc }}</small></button>
    </div>
    <ul class="how">
      <li><b>Chat</b> with the user. Ask the right questions.</li>
      <li><b>Fix</b> it with Directory, Terminal, Remote, Mail or Devices.</li>
      <li><b>Work like a real desk</b>: internal notes, and "Awaiting user" when you're waiting on a reply.</li>
      <li><b>Close</b> it: resolve, or escalate to the right team.</li>
    </ul>
    <button class="btn primary lg">Clock in →</button>
  </Modal>
</template>
