<script setup>
import { computed, ref, watch } from 'vue';
import { useGame } from '../../../stores/game.js';
import { useOps, BAD_NAME } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';

const g = useGame();
const ops = useOps();
const owners = computed(() => Object.keys(g.world.apps.onedrive));
const who = ref(owners.value[0]);
const files = computed(() => g.world.apps.onedrive[who.value].files);
const renaming = ref(null); // { from, to }
const versionsOf = ref(null);
watch(who, () => { renaming.value = null; versionsOf.value = null; });
function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); if (r.ok) { renaming.value = null; versionsOf.value = null; } }
</script>

<template>
  <label class="field"><span>Whose OneDrive</span>
    <select id="odUser" v-model="who"><option v-for="k in owners" :key="k" :value="k">{{ g.uname(k) }}</option></select>
  </label>
  <div class="u-card">
    <div v-for="f in files" :key="f.name" class="od-file">
      <div class="svc">
        <span class="mono" :class="{ 'bad-t': BAD_NAME.test(f.name) }">{{ f.name }}<br>
          <small class="muted">Sync: {{ f.sync }}<template v-if="f.link"> · Shared: {{ f.link }}</template><template v-if="f.restored"> · Restored to {{ f.restored }}</template></small>
        </span>
      </div>
      <div class="row wrap-row">
        <button class="btn xs" :data-rename="f.name" @click="renaming = { from: f.name, to: f.name }">Rename</button>
        <button v-if="f.versions" class="btn xs" :data-versions="f.name" @click="versionsOf = versionsOf === f.name ? null : f.name">Version history</button>
        <button v-if="f.link" class="btn xs danger-o" :data-unlink="f.name" @click="run(ops.odRemoveLink(who, f.name))">Remove sharing link</button>
      </div>
      <div v-if="renaming && renaming.from === f.name" class="reset-box pop">
        <input id="odNewName" v-model="renaming.to" class="search mono">
        <div class="row"><button id="odRenameGo" class="btn xs primary" @click="run(ops.odRename(who, f.name, renaming.to))">Save name</button><button class="btn xs ghost" @click="renaming = null">Cancel</button></div>
      </div>
      <div v-if="versionsOf === f.name" class="reset-box pop">
        <div v-for="v in f.versions" :key="v" class="svc">
          <span class="mono">{{ v }}</span>
          <span v-if="v === f.current" class="st">current</span>
          <button v-else class="btn xs" :data-restore="v" @click="run(ops.odRestoreVersion(who, f.name, v))">Restore</button>
        </div>
      </div>
    </div>
  </div>
</template>
