<script setup>
import { computed, ref } from 'vue';
import * as DATA from '../../../data/index.js';
import { useGame } from '../../stores/game.js';
import { useOps } from '../../stores/ops.js';
import { toast, beep } from '../../lib/fx.js';
import ProgressBar from '../ProgressBar.vue';
import NvrPanel from './NvrPanel.vue';

const g = useGame();
const ops = useOps();
const hostInput = ref('');
const h = computed(() => g.session && g.world.hosts[g.session.host]);
const busy = computed(() => !!g.ui.progress);
const diskCls = computed(() => (h.value.disk >= 90 ? 'crit' : h.value.disk >= 75 ? 'warn' : ''));
const policyLabel = p => (p === 'approved' ? 'Approved' : p === 'license' ? 'License req.' : 'Blocked');
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <div id="remoteBody">
    <form v-if="!g.session" id="connForm" class="connect pop" @submit.prevent="ops.connect(hostInput)">
      <p>Connect to a user's computer.<br><small class="muted">Ask the user for their computer name first.</small></p>
      <div class="row">
        <input id="connHost" v-model="hostInput" placeholder="e.g. XYZ-HR-022" autocomplete="off" class="mono">
        <button class="btn primary sm">Connect</button>
      </div>
    </form>

    <NvrPanel v-else-if="h.type === 'nvr'" :host="g.session.host" :h="h" />

    <div v-else class="host pop">
      <div class="host-head">
        <div>
          <span class="pulse-dot" :class="{ warn: g.session.guided }"></span><b class="mono">{{ g.session.host }}</b>
          <span v-if="g.session.guided" class="st warn"> guided</span>
        </div>
        <button id="disc" class="btn xs ghost" @click="ops.disconnect()">Disconnect</button>
      </div>
      <div class="kv"><span>User</span><b>{{ g.uname(h.owner) }}</b></div>
      <div class="kv"><span>OS</span><b>{{ h.os }}</b></div>
      <div class="kv"><span>IPv4</span><b class="mono" :class="{ 'bad-t': h.apipa }">{{ h.apipa ? '169.254.88.12' : h.ip }}</b></div>
      <div class="kv"><span>Disk C:</span><b>{{ h.disk }}%</b></div>
      <div class="meter" :class="diskCls"><span :style="{ width: h.disk + '%' }"></span></div>
      <h4>Services</h4>
      <div class="svc"><span>Print Spooler</span><span class="st" :class="h.spooler === 'Running' ? 'ok' : 'bad'">{{ h.spooler }}</span>
        <button class="btn xs" data-op="spooler" :disabled="busy" @click="ops.remoteOp('spooler')">Restart</button></div>
      <div class="svc"><span>Print queue</span><span class="st" :class="h.queue ? 'bad' : 'ok'">{{ h.queue }} job{{ h.queue === 1 ? '' : 's' }}</span></div>
      <div class="svc"><span>Outlook</span><span class="st" :class="h.outlook === 'Healthy' ? 'ok' : 'bad'">{{ h.outlook }}</span>
        <button class="btn xs" data-op="outlook" :disabled="busy" @click="ops.remoteOp('outlook')">Rebuild profile</button></div>
      <h4>Maintenance</h4>
      <div class="ops">
        <button class="btn sm" data-op="cleanup" :disabled="busy" @click="ops.remoteOp('cleanup')">Disk Cleanup</button>
        <button class="btn sm" data-op="reboot" :disabled="busy" @click="ops.remoteOp('reboot')">Restart PC</button>
      </div>
      <h4>Running apps</h4>
      <div v-for="app in h.running" :key="app" class="svc">
        <span>{{ app }}</span>
        <button class="btn xs" :data-endtask="app" @click="run(ops.endTask(app))">End task</button>
      </div>
      <h4>Teams devices</h4>
      <div class="svc">
        <span>Microphone</span>
        <select id="teamsMic" :value="h.teamsMic" @change="run(ops.setTeamsMic($event.target.value))">
          <option v-for="m in h.mics" :key="m">{{ m }}</option>
        </select>
      </div>
      <h4>Office add-ins</h4>
      <div v-for="a in h.addins" :key="a.name" class="svc">
        <span>{{ a.name }}<br><small class="muted">{{ a.app }}</small></span>
        <span class="st" :class="a.on ? 'ok' : 'warn'">{{ a.on ? 'On' : 'Off' }}</span>
        <button class="btn xs" :data-addin="a.name" @click="run(ops.addinToggle(a.name, !a.on))">{{ a.on ? 'Disable' : 'Enable' }}</button>
      </div>
      <h4>Browser extensions (Chrome)</h4>
      <div v-for="e in h.extensions" :key="e.name" class="svc">
        <span>{{ e.name }}<br><small class="muted">Can: {{ e.perms }}</small></span>
        <button class="btn xs" :data-extrm="e.name" @click="run(ops.extRemove(e.name))">Remove</button>
      </div>
      <h4>Software Center</h4>
      <div class="soft">
        <div v-for="s in DATA.SOFTWARE" :key="s.name" class="sw">
          <span>{{ s.name }}</span>
          <span class="pol" :class="s.policy">{{ policyLabel(s.policy) }}</span>
          <span v-if="h.software.includes(s.name)" class="st ok">Installed</span>
          <button v-else class="btn xs" :data-install="s.name" :disabled="busy" @click="ops.remoteOp('install', s.name)">Install</button>
        </div>
      </div>
      <ProgressBar />
    </div>
  </div>
</template>
