<script setup>
import { useGame } from '../../stores/game.js';
import { beep } from '../../lib/fx.js';
import NetOverview from './net/NetOverview.vue';
import NetWifi from './net/NetWifi.vue';
import NetSwitches from './net/NetSwitches.vue';
import NetDhcp from './net/NetDhcp.vue';
import NetFirewall from './net/NetFirewall.vue';
import NetVpn from './net/NetVpn.vue';

const g = useGame();
const VIEWS = [['overview', 'Overview'], ['wifi', 'Wi-Fi'], ['switches', 'Switches'], ['dhcp', 'DHCP'], ['firewall', 'Firewall'], ['vpn', 'VPN']];
</script>

<template>
  <div id="netBody">
    <div class="seg wrap">
      <button v-for="[k, label] in VIEWS" :key="k" :data-nv="k" :class="{ active: g.ui.netView === k }" @click="beep('click'); g.ui.netView = k">{{ label }}</button>
    </div>
    <div class="mail-view">
      <NetOverview v-if="g.ui.netView === 'overview'" />
      <NetWifi v-else-if="g.ui.netView === 'wifi'" />
      <NetSwitches v-else-if="g.ui.netView === 'switches'" />
      <NetDhcp v-else-if="g.ui.netView === 'dhcp'" />
      <NetFirewall v-else-if="g.ui.netView === 'firewall'" />
      <NetVpn v-else />
    </div>
  </div>
</template>
