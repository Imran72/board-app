<script setup lang="ts">



import { useWebApp } from 'vue-tg';
import { ref } from 'vue';
import { onMounted, onBeforeUnmount } from 'vue';
import './assets/styles.css';



const isUserChecked = ref(false);



const checkAndAddUser = async (initDataUnsafe) => {
  try {

    const userId = initDataUnsafe?.user?.id;
    const userFirstName = initDataUnsafe?.user?.first_name;
    const userLastName = initDataUnsafe?.user?.last_name;
    const userName = initDataUnsafe?.user?.username;
    const userCreatedDate = new Date().toISOString().split('T')[0];

    const response = await fetch('/api/users/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        userFirstName: userFirstName,
        userLastName: userLastName,
        userName: userName,
        userCreatedDate: userCreatedDate}),
    });

    const result = await response.json();
    isUserChecked.value = true;

  } catch (error) {
    console.error('Ошибка при проверке пользователя:', error);
  }
};


onMounted(() => {

  document.documentElement.style.overflow = 'hidden'; // Отключить прокрутку
  document.body.style.overflow = 'hidden';

  // обработка данных пользователя
  const {initDataUnsafe, ready} = useWebApp();

  // Уведомляем Telegram, что приложение готово
  ready();

  console.log('initDataUnsafe:', initDataUnsafe);
  console.log('user:', initDataUnsafe?.user);
  console.log('user.id:', initDataUnsafe?.user?.id);
  const userId = initDataUnsafe?.user?.id;

  if (userId) {
    checkAndAddUser(initDataUnsafe);
  } else {
    console.error('User ID не передан Telegram');
  }


});

// Восстановить скроллинг при выходе из layout
onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
});


</script>

<template>

  <div>


    <Header />

    <main class="main-content">

      <NuxtPage />


    </main>

    <Footer />

  </div>
</template>

<style scoped>



</style>