<template>
    <main class="main-content">
      <NuxtPage />
    </main>
    <Footer />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import './assets/styles.css';
import Footer from '~/components/Footer.vue';

onMounted(() => {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
});
</script>

<style scoped>
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 11vh; 
  overflow: hidden;
}
</style>
