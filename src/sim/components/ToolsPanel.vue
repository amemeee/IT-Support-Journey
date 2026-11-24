<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useGame } from '../stores/game.js';
import { beep } from '../lib/fx.js';
import DirectoryTab from './tabs/DirectoryTab.vue';
import TerminalTab from './tabs/TerminalTab.vue';
import RemoteTab from './tabs/RemoteTab.vue';
import MailTab from './tabs/MailTab.vue';
import DevicesTab from './tabs/DevicesTab.vue';
import NetworkTab from './tabs/NetworkTab.vue';
import AppsTab from './tabs/AppsTab.vue';
import KbTab from './tabs/KbTab.vue';

const g = useGame();
const TABS = [['dir', 'Directory'], ['term', 'Terminal'], ['remote', 'Remote'], ['mail', 'Mail'], ['devices', 'Devices'], ['net', 'Network'], ['apps', 'Apps'], ['kb', 'KB']];

// sliding underline under the active tab
const nav = ref(null);
const ind = ref({ width: '0px', transform: 'translateX(0)' });
async function moveIndicator() {
  await nextTick();
  const btn = nav.value && nav.value.querySelector(`button[data-tab="${g.ui.tab}"]`);
  if (btn) ind.value = { width: btn.offsetWidth + 'px', transform: `translateX(${btn.offsetLeft}px)` };
}
watch(() => g.ui.tab, moveIndicator);
onMounted(() => { moveIndicator(); addEventListener('resize', moveIndicator); });
</script>

<template>
  <aside class="panel tools">
    <nav ref="nav" class="tabs">
      <span class="ind" :style="ind"></span>
      <button
        v-for="[k, label] in TABS" :key="k" :data-tab="k" :class="{ active: g.ui.tab === k }"
        @click="beep('click'); g.ui.tab = k"
      >{{ label }}</button>
    </nav>
    <div id="tab-dir" class="tab-body" :class="{ active: g.ui.tab === 'dir' }"><DirectoryTab /></div>
    <div id="tab-term" class="tab-body" :class="{ active: g.ui.tab === 'term' }"><TerminalTab /></div>
    <div id="tab-remote" class="tab-body" :class="{ active: g.ui.tab === 'remote' }"><RemoteTab /></div>
    <div id="tab-mail" class="tab-body" :class="{ active: g.ui.tab === 'mail' }"><MailTab /></div>
    <div id="tab-devices" class="tab-body" :class="{ active: g.ui.tab === 'devices' }"><DevicesTab /></div>
    <div id="tab-net" class="tab-body" :class="{ active: g.ui.tab === 'net' }"><NetworkTab /></div>
    <div id="tab-apps" class="tab-body" :class="{ active: g.ui.tab === 'apps' }"><AppsTab /></div>
    <div id="tab-kb" class="tab-body" :class="{ active: g.ui.tab === 'kb' }"><KbTab /></div>
  </aside>
</template>
