<script setup>
import { computed, ref } from 'vue';
import * as DATA from '../../../data/index.js';

const q = ref('');
const articles = computed(() => DATA.KB.filter(k => !q.value || (k.title + k.body).toLowerCase().includes(q.value.toLowerCase())));
</script>

<template>
  <input id="kbSearch" v-model="q" class="search" placeholder="Search knowledge base…" autocomplete="off">
  <div id="kbList">
    <!-- KB bodies are written by us in src/data, so rendering their HTML is safe -->
    <details v-for="k in articles" :key="k.id" class="kb"><summary>{{ k.title }}</summary><div v-html="k.body"></div></details>
    <div v-if="!articles.length" class="empty-mini">No articles found</div>
  </div>
</template>
