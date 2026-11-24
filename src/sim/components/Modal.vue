<script setup>
// A modal stays in the page and fades in when `show` becomes true.
defineProps({
  id: { type: String, required: true },
  show: { type: Boolean, default: false },
  cardClass: { type: [String, Array, Object], default: '' },
  cardId: { type: String, default: undefined },
  tag: { type: String, default: 'div' } // 'form' for modals that submit
});
defineEmits(['submit']);
</script>

<template>
  <div :id="id" class="modal" :class="{ show }">
    <component :is="tag" :id="cardId" class="modal-card" :class="cardClass" @submit.prevent="$emit('submit')">
      <slot />
    </component>
  </div>
</template>
