<script setup lang="ts">


import {useRouter} from "#vue-router";
// useRouter — позволяет программно переходить между страницами (например, при клике на карточку события)
import {onMounted, ref} from "vue";
// onMounted — хук, выполняется после загрузки страницы
// ref — создаёт реактивную переменную (список событий)
import {useWebApp} from "vue-tg";
// даёт доступ к данным Telegram Web App
import styles from './assets/favorites.module.css'

definePageMeta({
  layout: 'header-favorites',
  // Указывает, что эта страница использует кастомный макет header-favorites (он берётся из папки layouts)
});


// Определяет структуру объекта события — чтобы TypeScript понимал, какие данные хранить в favorite_events
interface Event {
  event_name: string;
  event_id: string;
  event_banner: string;
  event_host: string;
  event_date: string;
  event_time: string;
  event_location: string;



}

const favorite_events = ref<Event[]>([]);
// Создаёт пустой массив событий, который позже можно будет заполнить.

// Загружаем карточки при монтировании компонента
onMounted(() => {

  console.log(getComputedStyle(document.body).fontFamily);
  // console.log(...): выводит в консоль шрифт страницы

  const {initDataUnsafe} = useWebApp();
  const userId = initDataUnsafe?.user?.id;
  // Получает ID пользователя из Telegram (useWebApp())

  // recalculateFavorites(userId);
  // loadFavorites.ts(userId);
  // загрузка избранных событий из сервера

});

const route = useRoute();
// useRoute — доступ к текущему маршруту.
const router = useRouter();

const goToEvent = (id: string) => {

  router.push({
        path: `/event/${id}`,
        query: { from: route.fullPath },
      }
  );
  // router.push(...) — переход на страницу события по его ID, а также
  // добавление в URL параметра from, чтобы знать, откуда пользователь пришёл.
};


</script>

<template>
  <!-- Корневой контейнер страницы -->
  <!-- Оборачивает всю страницу и применяет общий стиль (например, отступы и фон)-->
  <div :class="styles.saved_events_page">
    <!-- Контейнер для всех карточек событий -->
    <!-- Группирует все карточки событий, может быть сеткой или колонкой.-->
    <div :class="styles.events_container">
      <!-- Перебор списка событий -->
      <div
          :class="styles.event_card"
          v-for="(event, index) in favorite_events"
          :key="index"
          @click="goToEvent(event.event_id)">
        <!-- Перебираем каждый объект события из массива favorite_events -->
        <!-- :key="index" уникальный ключ для Vue (здесь используется индекс) -->
        <!-- При клике переходим на страницу события -->

        <!-- Блок с изображением события -->
        <div :class="styles.event_image">
          <img v-if="event.event_banner" :src="event.event_banner" alt="Event Banner" />
          <!--  v-if="event.event_banner" Проверка: если есть баннер, показываем картинку -->
        </div>

        <!-- Блок с деталями события -->
        <div :class="styles.event_details">

          <!-- Название события -->
          <h3 :class="styles.event_name">
            {{event.event_name}}</h3> <!-- Отображаем название события -->
          <p :class="styles.event_host">
            By @{{event.event_host}}</p>

          <!-- Блок с датой, временем и местом проведения -->
          <div :class="styles.event_meta">
            <div :class="styles.event_date">
              <!-- Иконка календаря -->
              <span :class="styles.icon">
                <img src="/icons/Date.svg" />  <!-- Картинка иконки даты -->
              </span>
              <span :class="styles.icon">{{event.event_date}} </span>
              <span :class="styles.icon">
                <img src="/icons/Time.svg" />
              </span>
              <span>{{event.event_time}}</span>
            </div>
            <div :class="styles.event_location">
              <span :class="styles.icon">
                <img src="/icons/Location.svg" />
              </span>
              <span>{{event.event_location}}</span>
            </div>
            <div :class="styles.event_separator"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}
/* Убирает отступы и скрывает горизонтальную прокрутку. */


</style>


