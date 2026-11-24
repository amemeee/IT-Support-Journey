<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useGame } from '../stores/game.js';
import { useOps } from '../stores/ops.js';
import { QUESTIONS, matchQuestion } from '../lib/questions.js';
import { fmt } from '../lib/util.js';
import { beep } from '../lib/fx.js';
import Avatar from './Avatar.vue';

const g = useGame();
const ops = useOps();
const t = computed(() => g.activeTicket);
const u = computed(() => t.value && g.world.users[t.value.sc.user]);
const first = computed(() => (u.value ? u.value.callName || u.value.name.split(' ')[0] : ''));
const hostKnown = computed(() => t.value && t.value.asked.has('computer') && t.value.sc.host);

const message = ref('');
const composer = ref('reply');   // 'reply' to the user, or 'note' for the team
const showLog = ref(false);
const chatEl = ref(null);
const shaking = ref(false);

const slaPct = computed(() => (t.value && g.timed ? Math.max(0, t.value.slaLeft / t.value.slaTotal * 100) : 100));
const slaClass = computed(() => {
  if (!t.value) return '';
  if (t.value.state === 'Awaiting user') return 'paused';
  return slaPct.value < 25 ? 'crit' : slaPct.value < 50 ? 'warn' : '';
});
const slaText = computed(() => {
  const x = t.value;
  if (!x) return '';
  if (!g.timed) return 'Training mode, no SLA';
  if (x.breached) return 'SLA BREACHED';
  return x.state === 'Awaiting user' ? `${fmt(x.slaLeft)} left · paused` : `${fmt(x.slaLeft)} left`;
});
const backIn = computed(() => (t.value && t.value.away ? Math.max(0, t.value.awayUntil - g.elapsed) : 0));

function send() {
  const v = message.value.trim();
  if (!v || !t.value) return;
  message.value = '';
  if (composer.value === 'note') { g.addNote(t.value, v); return; }
  const q = matchQuestion(v);
  g.ask(t.value, q ? q.k : null, v);
}
function connect() {
  const host = t.value.sc.host;
  if (g.world.hosts[host]) { g.ui.tab = 'remote'; ops.connect(host); }
  else { g.ui.devSel = host; g.ui.devQ = ''; g.ui.tab = 'devices'; }
}

// keep the newest message in view
watch(() => t.value && [t.value.id, t.value.chat.length, t.value.busy], async () => {
  await nextTick();
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight;
}, { deep: true });

watch(() => g.ui.shake, () => { shaking.value = false; requestAnimationFrame(() => { shaking.value = true; }); });
</script>

<template>
  <section id="ticketPane" class="panel ticket" :class="{ shake: shaking }">
    <div v-if="!t" class="empty-state">
      <h3>No ticket selected</h3>
      <p>Pick a ticket from the queue to start helping.</p>
    </div>

    <div v-else :key="t.id" class="t-body enter">
      <div class="t-head">
        <div>
          <div class="t-meta">
            <span class="prio" :class="t.sc.priority">{{ t.sc.priority }}</span>
            <span class="q-id">{{ t.id }}</span>
            <span class="chip">{{ t.sc.category }}</span>
          </div>
          <h2>{{ t.sc.title }}</h2>
        </div>
        <div class="t-sla">
          <div id="tSla" class="sla big" :class="slaClass"><span :style="{ width: slaPct + '%' }"></span></div>
          <small id="tSlaText">{{ slaText }}</small>
        </div>
      </div>

      <div class="t-state" role="group" aria-label="Ticket status">
        <small class="muted">Status</small>
        <button id="stateProgress" class="btn xs" :class="{ primary: t.state === 'In progress' }" @click="g.setState(t, 'In progress')">In progress</button>
        <button id="stateAwaiting" class="btn xs" :class="{ primary: t.state === 'Awaiting user' }" @click="g.setState(t, 'Awaiting user')">Awaiting user</button>
        <small class="muted state-help">"Awaiting user" pauses the SLA while you wait for a reply.</small>
      </div>

      <div class="requester">
        <Avatar :who="t.sc.user" :name="u.name" size="sm" />
        <div class="r-info">
          <b>{{ u.name }}</b>
          <small>{{ u.title }} · {{ u.dept }}</small>
          <small class="presence" :class="{ away: t.away }">
            <i></i>{{ t.away ? `In a meeting · back in about ${backIn}s` : 'Available' }}
          </small>
        </div>
        <div class="r-device">
          <template v-if="hostKnown">
            <span class="mono">{{ t.sc.host }}</span>
            <button id="quickConnect" class="btn xs" @click="connect">Connect ↗</button>
          </template>
          <span v-else class="muted">Device: ask the user</span>
        </div>
      </div>

      <div id="chat" ref="chatEl" class="chat">
        <template v-for="(m, i) in t.chat" :key="i">
          <div v-if="m.from === 'sys'" class="bubble sys"><b v-if="m.label">{{ m.label }}: </b>{{ m.text }}</div>
          <div v-else-if="m.from === 'note'" class="bubble note"><small>Internal note · only your team sees this</small>{{ m.text }}</div>
          <div v-else class="bubble" :class="m.from">{{ m.text }}</div>
        </template>
        <div v-if="t.busy" class="bubble user typing"><i></i><i></i><i></i></div>
      </div>

      <div v-if="g.expert" class="expert-note">Expert mode: type your questions to {{ first }}. You can write in English or BM.</div>
      <div id="chips" class="chips" :class="{ hidden: g.expert }">
        <button
          v-for="q in QUESTIONS" :key="q.k"
          class="q-chip" :class="{ used: t.asked.has(q.k) && q.k !== 'retry' }" :data-k="q.k"
          @click="g.ask(t, q.k)"
        >{{ q.label }}<small>{{ q.bm }}</small></button>
      </div>

      <div class="composer-mode" role="tablist">
        <button id="modeReply" :class="{ active: composer === 'reply' }" @click="composer = 'reply'">Reply to {{ first }}</button>
        <button id="modeNote" :class="{ active: composer === 'note' }" @click="composer = 'note'">Internal note</button>
      </div>
      <form id="chatForm" class="chat-in" :class="{ note: composer === 'note' }" @submit.prevent="send">
        <input
          id="chatInput" v-model="message" autocomplete="off"
          :placeholder="composer === 'note' ? 'Note for the team: what you checked, what you found…' : `Type a message to ${first}…`"
        >
        <button class="btn primary sm">{{ composer === 'note' ? 'Add note' : 'Send' }}</button>
      </form>

      <div class="t-foot">
        <button v-if="!g.expert" id="hintBtn" class="btn ghost sm" @click="g.showHint(t)">Hint{{ g.mode === 'standard' ? ' (−10)' : '' }}</button>
        <button id="logBtn" class="btn ghost sm" @click="showLog = !showLog">Activity ({{ t.log.length }})</button>
        <span class="spacer"></span>
        <button id="closeBtn" class="btn primary" @click="beep('click'); g.openClose(t)">Close ticket →</button>
      </div>
      <div id="activity" class="activity" :class="{ hidden: !showLog }">
        <div v-if="!t.log.length" class="muted">No actions taken yet.</div>
        <div v-for="(l, i) in t.log" :key="i"><span class="mono muted">{{ fmt(l.at) }}</span> {{ l.text }}</div>
      </div>
    </div>
  </section>
</template>
