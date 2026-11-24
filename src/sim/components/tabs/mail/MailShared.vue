<script setup>
import { computed, ref } from 'vue';
import * as DATA from '../../../../data/index.js';
import { useGame } from '../../../stores/game.js';
import { useOps, mailAddr } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const M = computed(() => g.world.mail);
const groups = computed(() => [
  ...Object.entries(M.value.shared).map(([k, x]) => ({ k, type: 'shared', x })),
  ...Object.entries(M.value.dls).map(([k, x]) => ({ k, type: 'dl', x }))
]);
const cur = computed(() => groups.value.find(x => x.k === g.ui.mailGroup) || groups.value[0]);
const userList = computed(() => Object.entries(g.world.users));
const who = ref(Object.keys(DATA.DIRECTORY)[0]);
const perm = ref('Full Access');

function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <label class="field">
    <span>Shared mailbox or list</span>
    <select id="grpPick" :value="cur.k" @change="g.ui.mailGroup = $event.target.value">
      <option v-for="x in groups" :key="x.k" :value="x.k">{{ x.type === 'shared' ? 'Shared' : 'List' }} · {{ mailAddr(x.k) }}</option>
    </select>
  </label>

  <div :key="cur.k" class="u-card pop">
    <div class="u-head"><div><b>{{ cur.x.name }}</b><small class="mono">{{ mailAddr(cur.k) }}</small></div></div>

    <template v-if="cur.type === 'shared'">
      <div class="kv"><span>Type</span><b>Shared mailbox</b></div>
      <h4 class="mh">Full Access <small class="muted">(open and read)</small></h4>
      <div class="chips-row">
        <span v-for="k in cur.x.full" :key="k" class="grp">{{ g.uname(k) }}<button :data-fa="k" title="Remove" @click="run(ops.sharedRemove(cur.k, k, 'Full Access'))">×</button></span>
        <span v-if="!cur.x.full.length" class="muted sm-t">Nobody</span>
      </div>
      <h4 class="mh">Send As <small class="muted">(send from this address)</small></h4>
      <div class="chips-row">
        <span v-for="k in cur.x.sendAs" :key="k" class="grp">{{ g.uname(k) }}<button :data-sa="k" title="Remove" @click="run(ops.sharedRemove(cur.k, k, 'Send As'))">×</button></span>
        <span v-if="!cur.x.sendAs.length" class="muted sm-t">Nobody</span>
      </div>
      <div class="add-grp row">
        <select id="shUser" v-model="who"><option v-for="[k, u] in userList" :key="k" :value="k">{{ u.name }}</option></select>
        <select id="shPerm" v-model="perm"><option>Full Access</option><option>Send As</option></select>
        <button id="shAdd" class="btn xs" @click="run(ops.sharedAdd(cur.k, who, perm))">+ Add</button>
      </div>
    </template>

    <template v-else-if="cur.x.dynamic">
      <div class="kv"><span>Type</span><b>Distribution list (dynamic)</b></div>
      <p class="muted sm-t" style="margin:0">Every enabled staff account is a member automatically.</p>
    </template>

    <template v-else>
      <div class="kv"><span>Type</span><b>Distribution list</b></div>
      <h4 class="mh">Members ({{ cur.x.members.length }})</h4>
      <div class="chips-row">
        <span v-for="k in cur.x.members" :key="k" class="grp">{{ g.uname(k) }}<button :data-dm="k" title="Remove" @click="run(ops.dlRemove(cur.k, k))">×</button></span>
        <span v-if="!cur.x.members.length" class="muted sm-t">No members</span>
      </div>
      <div class="add-grp row">
        <select id="dlUser" v-model="who"><option v-for="[k, u] in userList" :key="k" :value="k">{{ u.name }}</option></select>
        <button id="dlAdd" class="btn xs" @click="run(ops.dlAdd(cur.k, who))">+ Add member</button>
      </div>
    </template>
  </div>
</template>
