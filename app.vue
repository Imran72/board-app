<template>
    <NuxtLayout>

        <NuxtPage />

    </NuxtLayout>
</template>


<script lang="ts" setup>

import { onMounted } from 'vue';

onMounted(() => {


  window.Telegram.WebApp.disableVerticalSwipes()
  window.Telegram.WebApp.setBackgroundColor("#000000");



});



</script>

<style>


html, body {
  background-color: #000; /* Чёрный фон */
  font-family: 'Inter', sans-serif !important;
}


</style>