<script setup>
// Portrait from public/assets/avatars/<who>.webp, with initials underneath
// as a fallback when there is no image for this person.
import { initials } from '../lib/util.js';
import { missingAvatars } from '../lib/avatars.js';

defineProps({
  who: { type: String, required: true },   // username, e.g. "naisyah"
  name: { type: String, required: true },  // full name, for the initials
  size: { type: String, default: '' }       // '', 'xs', 'sm' or 'lg'
});
</script>

<template>
  <div class="avatar" :class="size">
    {{ initials(name) }}
    <img
      v-if="!missingAvatars.has(who)"
      :src="`assets/avatars/${who}.webp`"
      alt="" width="192" height="192" decoding="async" loading="lazy"
      @error="missingAvatars.add(who)"
    >
  </div>
</template>
