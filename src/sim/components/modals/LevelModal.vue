<script setup>
import { useGame, LEVELS } from '../../stores/game.js';
import Modal from '../Modal.vue';

const g = useGame();
</script>

<template>
  <Modal id="levelModal" :show="g.modals.level" card-class="levelup">
    <div class="lvl-ring"><span id="lvlNum">{{ g.level + 1 }}</span></div>
    <small class="muted">LEVEL UP</small>
    <h2 id="lvlName">{{ LEVELS[g.level].name }}</h2>
    <p class="muted">XP is saved in this browser.</p>
    <button id="lvlBtn" class="btn primary" @click="g.afterLevel()">Continue</button>
  </Modal>
</template>
