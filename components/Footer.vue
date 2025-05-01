

<script setup lang="ts" xmlns="http://www.w3.org/1999/html">




const route = useRoute();
const router = useRouter();


const footerItems = [
  { name: 'Топ', icon: '/icons/top.svg', route: '/top', active_icon: '/icons/top-white.svg'},
  { name: 'Лента', icon: '/icons/swipe.svg', route: '/', active_icon: '/icons/swipe-white.svg'},
  { name: 'Добавить Событие', icon: '/icons/add_event.svg', route: '/add-event', active_icon: '/icons/add_event-white.svg'},
  { name: 'Избранное', icon: '/icons/favorites.svg', route: '/favorites', active_icon: '/icons/favorites-white.svg'}
];

// Функция для перехода по маршруту
const goToRoute = (route: string) => {
  router.push(route);
};

// Проверка: является ли текущая страница активной
const isActive = (routePath: string) => {


  if (route.path === '/my_events' && routePath == '/favorites') {
    return true;
  }

  return route.path === routePath;
};





</script>

<template>

  <div class="footer">
    <div class="footer-container">
      <NuxtLink
          class="footer-item"
          v-for="(item, index) in footerItems"
          @click="goToRoute(item.route)"
          :key="index">


        <img
            :src="isActive(item.route) ? item.active_icon : item.icon"
            :alt="item.name"
            class="footer-icon"
        />

      </NuxtLink>
    </div>
  </div>

</template>

<style scoped>


.footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 11vh;
  background-color: transparent;
  z-index: 1000;

}

.footer-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
  flex-grow: 1;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.5); /* Полупрозрачный фон */
  border: none; /* Убираем границу */
  box-shadow: none; /* Убираем тень */
  outline: none; /* Убираем обводку */
  z-index: 1000;


}
.footer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;

}
.footer-item:hover {
  opacity: 0.8;
}

.footer-icon {
  width: 25px;
  height: 25px;
  margin-bottom: 20px;
  transition: fill 0.3s ease, stroke 0.3s ease;
}

.footer-item:active .footer-icon {
  transform: scale(0.9); /* Эффект нажатия (уменьшение) */
  transition: transform 0.1s ease; /* Плавное восстановление */

}


</style>