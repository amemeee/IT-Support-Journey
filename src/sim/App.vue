<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useGame } from './stores/game.js';
import { useOps } from './stores/ops.js';
import { setConfettiCanvas, setMutedSource } from './lib/fx.js';
import TopBar from './components/TopBar.vue';
import QueuePanel from './components/QueuePanel.vue';
import TicketPane from './components/TicketPane.vue';
import ToolsPanel from './components/ToolsPanel.vue';
import Toasts from './components/Toasts.vue';
import StartModal from './components/modals/StartModal.vue';
import CloseModal from './components/modals/CloseModal.vue';
import ResultModal from './components/modals/ResultModal.vue';
import LevelModal from './components/modals/LevelModal.vue';
import EndModal from './components/modals/EndModal.vue';
import MonitorModal from './components/modals/MonitorModal.vue';

const g = useGame();
const ops = useOps();
const confettiEl = ref(null);
setMutedSource(() => g.muted);

// Escape closes the close-ticket dialog and the CCTV monitor
function onKey(e) {
  if (e.key !== 'Escape') return;
  if (g.modals.close) g.cancelClose();
  if (g.modals.monitor) ops.closeMonitor();
}
onMounted(() => { setConfettiCanvas(confettiEl.value); addEventListener('keydown', onKey); });
onBeforeUnmount(() => removeEventListener('keydown', onKey));
</script>

<template>
  <TopBar />
  <main class="sim-grid">
    <QueuePanel />
    <TicketPane />
    <ToolsPanel />
  </main>

  <StartModal />
  <CloseModal />
  <ResultModal />
  <LevelModal />
  <EndModal />
  <MonitorModal />

  <Toasts />
  <canvas id="confetti" ref="confettiEl"></canvas>
</template>
