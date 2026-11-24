<script setup>
import { useGame } from '../../stores/game.js';
import { beep } from '../../lib/fx.js';
import AppOneDrive from './apps/AppOneDrive.vue';
import AppSharePoint from './apps/AppSharePoint.vue';
import AppTeams from './apps/AppTeams.vue';
import AppRooms from './apps/AppRooms.vue';
import AppConsents from './apps/AppConsents.vue';
import AppPortals from './apps/AppPortals.vue';

const g = useGame();
const VIEWS = [['onedrive', 'OneDrive'], ['sharepoint', 'SharePoint'], ['teams', 'Teams'], ['rooms', 'Rooms'], ['consents', 'App consents'], ['portals', 'Portals']];
</script>

<template>
  <div id="appsBody">
    <div class="seg wrap">
      <button v-for="[k, label] in VIEWS" :key="k" :data-av="k" :class="{ active: g.ui.appView === k }" @click="beep('click'); g.ui.appView = k">{{ label }}</button>
    </div>
    <div class="mail-view">
      <AppOneDrive v-if="g.ui.appView === 'onedrive'" />
      <AppSharePoint v-else-if="g.ui.appView === 'sharepoint'" />
      <AppTeams v-else-if="g.ui.appView === 'teams'" />
      <AppRooms v-else-if="g.ui.appView === 'rooms'" />
      <AppConsents v-else-if="g.ui.appView === 'consents'" />
      <AppPortals v-else />
    </div>
  </div>
</template>
