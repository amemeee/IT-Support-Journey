<script setup>
import { computed, onMounted, ref } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const N = computed(() => g.world.net);
const site = ref('');
const found = ref(null);
// opening this view counts as checking what is using the internet line
onMounted(() => ops.markTopTalkers());
function lookup() { found.value = site.value.trim() ? ops.filterLookup(site.value) : null; beep('click'); }
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); found.value = null; site.value = ''; }
</script>

<template>
  <div class="u-card">
    <h4 class="mh">Internet line: top users right now</h4>
    <div class="kv"><span>Total usage</span><b>{{ N.wan.utilisation }}%</b></div>
    <div v-for="t in N.wan.topTalkers" :key="t.host" class="svc">
      <span class="mono">{{ t.host }}<br><small class="muted">{{ t.what }}</small></span>
      <b>{{ t.pct }}%</b>
    </div>
  </div>

  <div class="u-card">
    <h4 class="mh">Web filter</h4>
    <small class="muted">Blocked categories</small>
    <div class="chips-row"><span v-for="c in N.filter.blockedCategories" :key="c" class="grp">{{ c }}</span></div>
    <form class="row" @submit.prevent="lookup">
      <input id="siteQ" v-model="site" class="search mono" placeholder="Check a site, e.g. portal.example.com.my">
      <button class="btn xs">Check</button>
    </form>
    <div v-if="found" class="svc">
      <span class="mono">{{ found.domain }}<br><small class="muted">{{ found.cat }}</small></span>
      <span class="st" :class="found.blocked ? 'bad' : 'ok'">{{ found.blocked ? 'Blocked' : 'Allowed' }}</span>
      <button v-if="found.blocked" id="siteAllow" class="btn xs danger-o" @click="run(ops.filterAllow(found.domain))">Allow this site</button>
    </div>
    <h4 class="mh">Exceptions</h4>
    <div v-for="d in N.filter.exceptions" :key="d" class="svc"><span class="mono">{{ d }}</span><button class="btn xs ghost" @click="run(ops.filterRemove(d))">Remove</button></div>
    <div v-if="!N.filter.exceptions.length" class="muted sm-t">None</div>
  </div>
</template>
