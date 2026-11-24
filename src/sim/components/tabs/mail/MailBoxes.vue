<script setup>
import { computed, ref, watch } from 'vue';
import * as DATA from '../../../../data/index.js';
import { useGame } from '../../../stores/game.js';
import { useOps, mailAddr } from '../../../stores/ops.js';
import { toast, beep } from '../../../lib/fx.js';
import Avatar from '../../Avatar.vue';

const g = useGame();
const ops = useOps();
const M = computed(() => g.world.mail);

const rows = computed(() => {
  const q = g.ui.mailQ.toLowerCase().trim();
  return Object.entries(g.world.users).filter(([k, u]) => !q || (k + ' ' + u.name + ' ' + u.dept).toLowerCase().includes(q));
});
const k = computed(() => g.ui.mailUser);
const u = computed(() => k.value && g.world.users[k.value]);
const b = computed(() => k.value && M.value.boxes[k.value]);
const pct = computed(() => (b.value ? Math.round(b.value.size / b.value.quota * 100) : 0));
const userList = computed(() => Object.entries(g.world.users));

const ooo = ref(null);  // auto-reply text while the editor is open
const calUser = ref(Object.keys(DATA.DIRECTORY)[0]);
const calRole = ref('Reviewer');
watch(k, () => { ooo.value = null; });

function run(r) { toast(r.msg, r.ok ? 'good' : 'warn'); beep('click'); ooo.value = null; }
function flags(key) {
  const x = M.value.boxes[key] || {};
  return { nolic: !x.licensed, full: x.size / x.quota >= .9, rules: x.forward || (x.rules && x.rules.length) };
}
</script>

<template>
  <input id="mbSearch" v-model="g.ui.mailQ" class="search" placeholder="Search mailboxes…" autocomplete="off">
  <div class="dir-results">
    <button v-for="[key, usr] in rows" :key="key" class="d-row" :class="{ active: k === key }" :data-mu="key" @click="beep('click'); g.ui.mailUser = key">
      <Avatar :who="key" :name="usr.name" size="xs" />
      <div><b>{{ usr.name }}</b><small>{{ mailAddr(key) }}</small></div>
      <span class="dots" :class="{ hidden: g.expert }">
        <i v-if="flags(key).nolic" class="d off" title="No licence"></i>
        <i v-if="flags(key).full" class="d lock" title="Almost full"></i>
        <i v-if="flags(key).rules" class="d exp" title="Rules or forwarding"></i>
      </span>
    </button>
    <div v-if="!rows.length" class="empty-mini">No matching mailboxes</div>
  </div>

  <div id="mbDetail">
    <div v-if="!b" class="empty-mini">Select a mailbox.</div>
    <div v-else :key="k" class="u-card pop">
      <div class="u-head"><Avatar :who="k" :name="u.name" /><div><b>{{ u.name }}</b><small class="mono">{{ mailAddr(k) }}</small></div></div>
      <div class="svc">
        <span>Microsoft 365 licence</span>
        <span v-if="b.licensed" class="st ok">Assigned</span>
        <template v-else><span class="st bad">None</span><button id="mLic" class="btn xs" @click="run(ops.licence(k))">Assign ({{ M.licencesFree }} free)</button></template>
      </div>
      <template v-if="b.licensed">
        <div class="kv"><span>Mailbox</span><b>{{ b.size.toFixed(1) }} / {{ b.quota }} GB · {{ pct }}%</b></div>
        <div class="meter" :class="pct >= 90 ? 'crit' : pct >= 75 ? 'warn' : ''"><span :style="{ width: Math.min(100, pct) + '%' }"></span></div>
        <div class="svc">
          <span>Online archive</span>
          <span v-if="b.archive" class="st ok">Enabled</span>
          <template v-else><span class="st warn">Off</span><button id="mArch" class="btn xs" @click="run(ops.archive(k))">Enable</button></template>
        </div>
        <div class="svc">
          <span>Automatic replies</span>
          <template v-if="b.autoReply"><span class="st ok">On</span><button id="mOooOff" class="btn xs ghost" @click="run(ops.autoReply(k, null))">Turn off</button></template>
          <template v-else><span class="st warn">Off</span><button id="mOooOn" class="btn xs" @click="ooo = `Thank you for your email. I am out of the office until Friday with limited access to email. For urgent matters, please contact the team on ops@${DATA.MAIL_DOMAIN}.`">Set up</button></template>
        </div>
        <div v-if="ooo !== null" class="reset-box pop">
          <textarea id="oooText" v-model="ooo" rows="3"></textarea>
          <div class="row">
            <button id="oooGo" class="btn xs primary" @click="run(ops.autoReply(k, ooo.trim() || 'Out of office.'))">Turn on</button>
            <button id="oooNo" class="btn xs ghost" @click="ooo = null">Cancel</button>
          </div>
        </div>
        <div v-if="b.forward" class="svc fwd">
          <span>Forwarding to an outside address</span>
          <button id="mFwdRm" class="btn xs" @click="run(ops.forwardOff(k))">Remove</button>
          <code class="fwd-addr">{{ b.forward }}</code>
        </div>
        <div v-else class="svc"><span>Forwarding</span><span class="st ok">None</span></div>

        <h4 class="mh">Inbox rules</h4>
        <div v-for="(r, i) in b.rules" :key="i" class="rule">
          <div><b class="mono">{{ r.name }}</b><small>If {{ r.cond }}, {{ r.action }}</small></div>
          <button class="btn xs" :data-rrm="i" @click="run(ops.ruleRemove(k, i))">Delete</button>
        </div>
        <div v-if="!b.rules.length" class="muted sm-t">No rules</div>

        <h4 class="mh">Calendar permissions</h4>
        <div class="chips-row">
          <span v-for="c in b.cal" :key="c.u" class="grp">{{ g.uname(c.u) }} · {{ c.role }}<button :data-crm="c.u" title="Remove" @click="run(ops.calRemove(k, c.u))">×</button></span>
          <span v-if="!b.cal.length" class="muted sm-t">Only the owner</span>
        </div>
        <div class="add-grp row">
          <select id="calUser" v-model="calUser"><option v-for="[key, usr] in userList" :key="key" :value="key">{{ usr.name }}</option></select>
          <select id="calRole" v-model="calRole"><option>Reviewer</option><option>Editor</option></select>
          <button id="calAdd" class="btn xs" @click="run(ops.calAdd(k, calUser, calRole))">+ Add</button>
        </div>
      </template>
      <p v-else class="muted sm-t" style="margin:0">No mailbox exists until a licence is assigned.</p>
    </div>
  </div>
</template>
