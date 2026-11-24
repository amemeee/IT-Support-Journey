<script setup>
import { computed, ref } from 'vue';
import * as DATA from '../../../../data/index.js';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const teams = computed(() => Object.keys(g.world.apps.teams));
const sel = ref(teams.value[0]);
const t = computed(() => g.world.apps.teams[sel.value]);
const who = ref(Object.keys(DATA.DIRECTORY)[0]);
const domain = ref('');
const name = k => (g.world.users[k] ? g.uname(k) : k);
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); }
</script>

<template>
  <label class="field"><span>Team</span>
    <select id="teamPick" v-model="sel"><option v-for="x in teams" :key="x">{{ x }}</option></select>
  </label>
  <div :key="sel" class="u-card pop">
    <h4 class="mh">Owners</h4>
    <div class="chips-row"><span v-for="k in t.owners" :key="k" class="grp" :class="{ danger: !g.world.users[k] }">{{ name(k) }}</span></div>
    <h4 class="mh">Members</h4>
    <div class="chips-row"><span v-for="k in t.members" :key="k" class="grp">{{ name(k) }}</span><span v-if="!t.members.length" class="muted sm-t">None</span></div>
    <div class="add-grp row">
      <select id="teamUser" v-model="who"><option v-for="(u, k) in g.world.users" :key="k" :value="k">{{ u.name }}</option></select>
      <button id="teamOwnerAdd" class="btn xs" @click="run(ops.teamOwnerAdd(sel, who))">Make owner</button>
    </div>
  </div>

  <div class="u-card">
    <h4 class="mh">External access <small class="muted">(other companies that can chat with staff)</small></h4>
    <div class="chips-row">
      <span v-for="d in g.world.apps.externalAccess.allowedDomains" :key="d" class="grp mono">{{ d }}</span>
      <span v-if="!g.world.apps.externalAccess.allowedDomains.length" class="muted sm-t">No external domains allowed</span>
    </div>
    <div class="add-grp row">
      <input id="extDomain" v-model="domain" class="search mono" placeholder="partner.com.my">
      <button id="extAllow" class="btn xs danger-o" @click="run(ops.externalAllow(domain)); domain = ''">Allow domain</button>
    </div>
  </div>
</template>
