<script setup>
import { toasts } from '../lib/fx.js';
</script>

<template>
  <div id="toasts">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="[t.kind, { out: t.out }]">
      <span>{{ t.msg }}</span>
    </div>
  </div>
</template>
