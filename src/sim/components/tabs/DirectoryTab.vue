<script setup>
import { computed, ref, watch } from 'vue';
import * as DATA from '../../../data/index.js';
import { useGame } from '../../stores/game.js';
import { useOps, NET_DOMAIN, tempPassword } from '../../stores/ops.js';
import { toast, beep } from '../../lib/fx.js';
import Avatar from '../Avatar.vue';

const g = useGame();
const ops = useOps();

const rows = computed(() => {
  const q = g.ui.dirQ.toLowerCase().trim();
  return Object.entries(g.world.users).filter(([k, u]) => !q || (k + ' ' + u.name + ' ' + u.dept + ' ' + u.empId).toLowerCase().includes(q));
});
const k = computed(() => g.ui.selUser);
const u = computed(() => k.value && g.world.users[k.value]);
const addable = computed(() => (u.value ? DATA.GROUPS.filter(x => !u.value.groups.includes(x)) : []));

const groupToAdd = ref('');
const reset = ref(null); // { pw, mustChange } while the reset box is open
watch(k, () => { reset.value = null; groupToAdd.value = ''; });
watch(addable, v => { if (!v.includes(groupToAdd.value)) groupToAdd.value = v[0] || ''; }, { immediate: true });

function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); reset.value = null; }
function select(key) { g.ui.selUser = key; beep('click'); }
</script>

<template>
  <input id="dirSearch" v-model="g.ui.dirQ" class="search" placeholder="Search name, username, staff ID…" autocomplete="off">
  <div id="dirResults" class="dir-results">
    <button v-for="[key, usr] in rows" :key="key" class="d-row" :class="{ active: k === key }" :data-u="key" @click="select(key)">
      <Avatar :who="key" :name="usr.name" size="xs" />
      <div><b>{{ usr.name }}</b><small>{{ key }}@{{ NET_DOMAIN }} · {{ usr.dept }}</small></div>
      <span class="dots" :class="{ hidden: g.expert }">
        <i v-if="!usr.enabled" class="d off" title="Disabled"></i>
        <i v-if="usr.locked" class="d lock" title="Locked"></i>
        <i v-if="usr.pwdExpired" class="d exp" title="Password expired"></i>
      </span>
    </button>
    <div v-if="!rows.length" class="empty-mini">No matching users</div>
  </div>

  <div id="dirDetail">
    <div v-if="!u" class="empty-mini">Select a user to view their account.</div>
    <div v-else :key="k" class="u-card pop">
      <div class="u-head">
        <Avatar :who="k" :name="u.name" />
        <div>
          <b>{{ u.name }}</b><small>{{ u.title }} · {{ u.dept }}</small>
          <small class="mono">{{ k }}@{{ NET_DOMAIN }} · {{ u.empId }} · {{ u.phone }}</small>
        </div>
      </div>
      <div class="u-status">
        <span class="st" :class="u.enabled ? 'ok' : 'bad'">{{ u.enabled ? 'Enabled' : 'Disabled' }}</span>
        <span class="st" :class="!u.locked ? 'ok' : 'bad'">{{ u.locked ? 'Locked out' : 'Not locked' }}</span>
        <span class="st" :class="!u.pwdExpired ? 'ok' : 'bad'">{{ u.pwdExpired ? 'Password expired' : 'Password OK' }}</span>
        <span class="st" :class="u.mfa === 'Registered' ? 'ok' : 'bad'">MFA: {{ u.mfa }}</span>
      </div>
      <div class="u-groups">
        <small class="muted">Groups</small>
        <div>
          <span v-for="grp in u.groups" :key="grp" class="grp" :class="{ danger: grp === 'Domain Admins' }">
            {{ grp }}<button :data-rm="grp" title="Remove" @click="run(ops.removeGroup(k, grp))">×</button>
          </span>
          <span v-if="!u.groups.length" class="muted">none</span>
        </div>
        <div class="add-grp">
          <select id="grpSel" v-model="groupToAdd"><option v-for="grp in addable" :key="grp">{{ grp }}</option></select>
          <button id="grpAdd" class="btn xs" @click="groupToAdd && run(ops.addGroup(k, groupToAdd))">+ Add</button>
        </div>
      </div>
      <div class="u-actions">
        <button id="aUnlock" class="btn sm" :disabled="!u.locked && !g.expert" @click="run(ops.unlock(k))">Unlock</button>
        <button id="aReset" class="btn sm" @click="reset = { pw: tempPassword(), mustChange: true }">Reset password</button>
        <button id="aMfa" class="btn sm" @click="run(ops.resetMfa(k))">Reset MFA</button>
        <button id="aToggle" class="btn sm" :class="{ 'danger-o': u.enabled }" @click="run(ops.setEnabled(k, !u.enabled))">{{ u.enabled ? 'Disable' : 'Enable' }}</button>
      </div>
      <div id="resetBox">
        <div v-if="reset" class="reset-box pop">
          <div>Temporary password: <code>{{ reset.pw }}</code></div>
          <label><input id="mustChange" v-model="reset.mustChange" type="checkbox"> User must change password at next sign-in</label>
          <div class="row">
            <button id="rsGo" class="btn xs primary" @click="run(ops.resetPwd(k, reset.mustChange, reset.pw))">Confirm reset</button>
            <button id="rsNo" class="btn xs ghost" @click="reset = null">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
