<script setup>
import { computed, ref, watch } from 'vue';
import * as DATA from '../../../data/index.js';
import { useGame } from '../../stores/game.js';
import { useOps, deviceIssues } from '../../stores/ops.js';
import { toast, beep } from '../../lib/fx.js';

const g = useGame();
const ops = useOps();
const ownerName = d => (d.owner ? g.uname(d.owner) : 'Unassigned');
const short = d => (d.type === 'Phone' ? 'PH' : d.type === 'Desktop' ? 'DT' : 'LT');

const list = computed(() => {
  const q = g.ui.devQ.toLowerCase().trim();
  return Object.values(g.world.devices).filter(d => !q || (d.name + ' ' + ownerName(d) + ' ' + d.type + ' ' + d.model).toLowerCase().includes(q));
});
const d = computed(() => g.ui.devSel && g.world.devices[g.ui.devSel]);
const issues = computed(() => (d.value ? deviceIssues(d.value) : []));
const win = computed(() => d.value && d.value.type !== 'Phone');
const states = computed(() => {
  const x = d.value; if (!x) return [];
  return [x.locked && 'Locked', x.lost && 'Marked lost', x.isolated && 'Isolated', x.wiped && (x.wiped === 'full' ? 'Wiped' : 'Work data wiped')].filter(Boolean);
});
const assignTo = ref(Object.keys(DATA.DIRECTORY)[0]);
const confirmWipe = ref(false);
watch(() => g.ui.devSel, () => { confirmWipe.value = false; });

function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); confirmWipe.value = false; }
</script>

<template>
  <div id="devBody">
    <input id="devSearch" v-model="g.ui.devQ" class="search" placeholder="Search devices or owners…" autocomplete="off">
    <div class="dir-results">
      <button v-for="x in list" :key="x.name" class="d-row" :class="{ active: g.ui.devSel === x.name }" :data-dev="x.name" @click="beep('click'); g.ui.devSel = x.name">
        <div class="avatar xs">{{ short(x) }}</div>
        <div><b class="mono">{{ x.name }}</b><small>{{ ownerName(x) }} · {{ x.type }}{{ x.ownership === 'Personal' ? ' · personal' : '' }}</small></div>
        <span class="dots" :class="{ hidden: g.expert }">
          <i v-if="deviceIssues(x).length" class="d lock" title="Not compliant"></i>
          <i v-if="x.lost || x.wiped" class="d off" title="Lost or wiped"></i>
        </span>
      </button>
      <div v-if="!list.length" class="empty-mini">No matching devices</div>
    </div>

    <div id="devDetail">
      <div v-if="!d" class="empty-mini">Select a device.</div>
      <div v-else :key="d.name" class="u-card pop">
        <div class="u-head">
          <div class="avatar">{{ d.type === 'Phone' ? 'PH' : 'PC' }}</div>
          <div><b class="mono">{{ d.name }}</b><small>{{ d.model }} · {{ d.ownership }}</small><small>{{ d.os }} · last check-in {{ d.lastSync }}</small></div>
        </div>
        <div v-if="d.owner" class="kv"><span>Assigned to</span><b>{{ ownerName(d) }}</b></div>
        <template v-else>
          <div class="svc"><span>Assigned to</span><span class="st bad">Nobody</span></div>
          <div class="add-grp row">
            <select id="devAssignSel" v-model="assignTo"><option v-for="(u, k) in g.world.users" :key="k" :value="k">{{ u.name }}</option></select>
            <button id="devAssign" class="btn xs" @click="run(ops.devAssign(d.name, assignTo))">Assign</button>
          </div>
        </template>
        <div v-if="states.length" class="chips-row"><span v-for="s in states" :key="s" class="st bad">{{ s }}</span></div>
        <div class="svc"><span>Compliance</span><span class="st" :class="issues.length ? 'bad' : 'ok'">{{ issues.length ? 'Not compliant' : 'Compliant' }}</span></div>
        <ul v-if="issues.length" class="issues"><li v-for="i in issues" :key="i">{{ i }}</li></ul>

        <template v-if="win">
          <h4 class="mh">BitLocker</h4>
          <div class="svc">
            <span>Encryption</span>
            <span v-if="d.encrypted" class="st ok">On</span>
            <template v-else><span class="st bad">Off</span><button id="devEnc" class="btn xs" @click="run(ops.devEncrypt(d.name))">Start encryption</button></template>
          </div>
          <div v-if="d.encrypted && d.keyId" class="svc">
            <span>Recovery key ID<br><small class="mono muted">{{ d.keyId }}</small></span>
            <button id="devKey" class="btn xs danger-o" @click="run(ops.devRevealKey(d.name))">Show recovery key</button>
          </div>
          <code v-if="d.keyRevealed" class="fwd-addr">{{ d.key }}</code>

          <h4 class="mh">Health</h4>
          <div class="svc">
            <span>Firewall</span>
            <span v-if="d.firewall" class="st ok">On</span>
            <template v-else><span class="st bad">Off</span><button id="devFw" class="btn xs" @click="run(ops.devFirewall(d.name))">Turn on</button></template>
          </div>
          <div class="svc">
            <span>Windows Update<br><small class="muted">{{ d.update }}</small></span>
            <span v-if="d.update === 'Up to date'" class="st ok">OK</span>
            <button v-else id="devUpd" class="btn xs" @click="run(ops.devUpdate(d.name))">Clear cache & retry</button>
          </div>
          <div class="svc">
            <span>Drivers<template v-if="d.driver"><br><small class="muted">{{ d.driver }}</small></template></span>
            <button v-if="d.driver" id="devRb" class="btn xs" @click="run(ops.devRollback(d.name))">Roll back</button>
            <span v-else class="st ok">OK</span>
          </div>
          <div class="svc">
            <span>USB storage</span>
            <span class="st" :class="d.usb === 'Blocked' ? 'ok' : 'warn'">{{ d.usb }}</span>
            <button v-if="d.usb === 'Blocked'" id="devUsbOn" class="btn xs danger-o" @click="run(ops.devUsb(d.name, true))">Allow temporarily</button>
            <button v-else id="devUsbOff" class="btn xs" @click="run(ops.devUsb(d.name, false))">Block</button>
          </div>
        </template>

        <h4 class="mh">Actions</h4>
        <div class="ops">
          <button id="devSync" class="btn sm" @click="run(ops.devSync(d.name))">Sync</button>
          <button id="devLock" class="btn sm" @click="run(ops.devLock(d.name))">Remote lock</button>
          <button id="devLost" class="btn sm" @click="run(ops.devLost(d.name))">Mark as lost</button>
          <button v-if="win" id="devIso" class="btn sm" @click="run(ops.devIsolate(d.name))">Isolate</button>
          <button v-if="d.ownership === 'Personal' || d.type === 'Phone'" id="devSel" class="btn sm" @click="run(ops.devWipe(d.name, 'selective'))">Wipe work data</button>
          <button id="devWipe" class="btn sm danger-o" @click="confirmWipe = true">Full wipe…</button>
        </div>
        <div id="devConfirm">
          <div v-if="confirmWipe" class="reset-box pop">
            <b>Erase everything on {{ d.name }}?</b>
            <span class="muted">This can't be undone.{{ d.ownership === 'Personal' ? ' This is a personal device.' : '' }}</span>
            <div class="row">
              <button id="wipeGo" class="btn xs primary" @click="run(ops.devWipe(d.name, 'full'))">Wipe device</button>
              <button id="wipeNo" class="btn xs ghost" @click="confirmWipe = false">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
