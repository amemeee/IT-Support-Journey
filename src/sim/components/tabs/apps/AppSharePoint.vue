<script setup>
import { computed, ref } from 'vue';
import * as DATA from '../../../../data/index.js';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const sites = computed(() => Object.keys(g.world.apps.sites));
const sel = ref(sites.value[0]);
const s = computed(() => g.world.apps.sites[sel.value]);
const who = ref(Object.keys(DATA.DIRECTORY)[0]);
const role = ref('Members');
const GROUPS = [['Owners', 'owners', 'full control'], ['Members', 'members', 'edit'], ['Visitors', 'visitors', 'read']];
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <label class="field"><span>Site</span>
    <select id="spSite" v-model="sel"><option v-for="x in sites" :key="x">{{ x }}</option></select>
  </label>
  <div :key="sel" class="u-card pop">
    <template v-for="[label, key, what] in GROUPS" :key="key">
      <h4 class="mh">{{ label }} <small class="muted">({{ what }})</small></h4>
      <div class="chips-row">
        <span v-for="k in s[key]" :key="k" class="grp">{{ g.uname(k) }}<button title="Remove" @click="run(ops.spRemove(sel, k, label))">×</button></span>
        <span v-if="!s[key].length" class="muted sm-t">Nobody</span>
      </div>
    </template>
    <div class="add-grp row">
      <select id="spUser" v-model="who"><option v-for="(u, k) in g.world.users" :key="k" :value="k">{{ u.name }}</option></select>
      <select id="spRole" v-model="role"><option>Members</option><option>Visitors</option><option>Owners</option></select>
      <button id="spAdd" class="btn xs" @click="run(ops.spAdd(sel, who, role))">+ Add</button>
    </div>
    <h4 class="mh">Recycle bin <small class="muted">(kept 93 days)</small></h4>
    <div v-for="(r, i) in s.recycle" :key="i" class="svc">
      <span>{{ r.item }}<br><small class="muted">Deleted by {{ g.uname(r.deletedBy) }} · {{ r.when }}</small></span>
      <span v-if="r.restored" class="st ok">Restored</span>
      <button v-else class="btn xs" :data-sprestore="i" @click="run(ops.spRestore(sel, i))">Restore</button>
    </div>
    <div v-if="!s.recycle.length" class="muted sm-t">Empty</div>
  </div>
</template>
