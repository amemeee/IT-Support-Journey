<script setup>
import { nextTick, ref, watch } from 'vue';
import * as DATA from '../../../data/index.js';
import { useGame } from '../../stores/game.js';
import Modal from '../Modal.vue';

const g = useGame();
const note = ref('');
const team = ref(DATA.TEAMS[0]);
const noteEl = ref(null);
watch(() => g.modals.close, open => {
  if (!open) return;
  note.value = ''; team.value = DATA.TEAMS[0];
  nextTick(() => setTimeout(() => noteEl.value && noteEl.value.focus(), 200));
});
</script>

<template>
  <Modal id="closeModal" :show="g.modals.close">
    <h3>Close ticket</h3>
    <p id="closeId" class="muted">{{ g.closing ? `${g.closing.id} · ${g.closing.sc.title}` : '' }}</p>
    <label class="field">
      <span>Resolution notes (the user sees these)</span>
      <textarea id="closeNote" ref="noteEl" v-model="note" rows="4" placeholder="What was wrong, what you did, and how you confirmed it…"></textarea>
    </label>
    <div class="close-actions">
      <button id="resolveBtn" class="btn good" @click="g.closeTicket('resolve', team, note)">Resolve (fixed)</button>
      <div class="esc-row">
        <select id="escTeam" v-model="team"><option v-for="x in DATA.TEAMS" :key="x">{{ x }}</option></select>
        <button id="escBtn" class="btn warn" @click="g.closeTicket('escalate', team, note)">Escalate</button>
      </div>
    </div>
    <button id="cancelClose" class="btn ghost sm" @click="g.cancelClose()">Back to ticket</button>
  </Modal>
</template>
