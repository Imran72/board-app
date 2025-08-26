<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import './assets/styles.css';
import { useTelegramInit } from '~/composables/useTelegramInit';

const isUserChecked = ref(false);

const { isTelegramReady, isInitializing, userData, error, initTelegram } = useTelegramInit();

const checkAndAddUser = async (data: any) => {
  try {
    const userId = data?.user?.id;
    const userFirstName = data?.user?.first_name;
    const userLastName = data?.user?.last_name;
    const userName = data?.user?.username;
    const userCreatedDate = new Date().toISOString().split('T')[0];

    await fetch('/api/users/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userFirstName,
        userLastName,
        userName,
        userCreatedDate
      }),
    });
    isUserChecked.value = true;
    console.log('Пользователь успешно проверен и добавлен');
  } catch (error) {
    console.error('Ошибка при проверке пользователя:', error);
  }
};

// Следим за готовностью Telegram Web App
watch(isTelegramReady, (ready) => {
  if (ready && userData.value) {
    console.log('Telegram готов, проверяем пользователя:', userData.value);
    checkAndAddUser(userData.value);
  }
});

onMounted(() => {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
});
</script>

<template>
  <div>
    <!-- Индикатор загрузки Telegram Web App -->
    <div v-if="isInitializing" class="telegram-loading">
      <div class="loading-spinner"></div>
      <p>Инициализация Telegram Web App...</p>
    </div>
    
    <!-- Основной контент -->
    <div v-else-if="isTelegramReady">
      <main class="main-content">
        <NuxtPage />
      </main>
      <Footer />
    </div>
    
    <!-- Ошибка инициализации -->
    <div v-else-if="error" class="telegram-error">
      <h2>Ошибка инициализации</h2>
      <p>{{ error }}</p>
      <button @click="initTelegram" class="retry-button">Повторить</button>
    </div>
  </div>
</template>

<style scoped>
.telegram-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #000;
  color: white;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #333;
  border-top: 3px solid #B3F93F;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.telegram-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #000;
  color: white;
  text-align: center;
  padding: 20px;
}

.telegram-error h2 {
  color: #ff6b6b;
  margin-bottom: 15px;
}

.retry-button {
  background-color: #B3F93F;
  color: #000;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #9be02f;
}
</style>