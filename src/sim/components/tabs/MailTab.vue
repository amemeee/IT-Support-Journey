<script setup>
import { computed } from 'vue';
import { useGame } from '../../stores/game.js';
import { beep } from '../../lib/fx.js';
import MailBoxes from './mail/MailBoxes.vue';
import MailShared from './mail/MailShared.vue';
import MailQuarantine from './mail/MailQuarantine.vue';
import MailTrace from './mail/MailTrace.vue';

const g = useGame();
const held = computed(() => g.world.mail.quarantine.filter(q => q.state === 'held').length);
const views = computed(() => [['box', 'Mailboxes'], ['shared', 'Shared & lists'], ['quar', `Quarantine${held.value ? ` (${held.value})` : ''}`], ['trace', 'Trace']]);
</script>

<template>
  <div id="mailBody">
    <div class="seg">
      <button v-for="[k, label] in views" :key="k" :data-mv="k" :class="{ active: g.ui.mailView === k }" @click="beep('click'); g.ui.mailView = k">{{ label }}</button>
    </div>
    <div id="mailView" class="mail-view">
      <MailBoxes v-if="g.ui.mailView === 'box'" />
      <MailShared v-else-if="g.ui.mailView === 'shared'" />
      <MailQuarantine v-else-if="g.ui.mailView === 'quar'" />
      <MailTrace v-else />
    </div>
  </div>
</template>
