<template>
  <div class="swipe-container">



    <div
        v-if="currentCard"
        class="card"
        :style="mergedStyle"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @click="goToEvent(currentCard.event_id)"
    >
<!--      v-if: показывает карточку только если данные текущей карточки загружены-->


      <img :src="currentCard.event_banner" alt="Event Banner" class="card-image" />

      <div class="organizer-tag">
        <img src="/icons/user_icon.svg" alt="Organizer" class="organizer-icon" />
        <span>{{ currentCard.event_host }}</span>
      </div>


      <div class="card-info" >
        <div class="event-name">{{ currentCard.event_name }}</div>


        <div  class="likes-container">
<!--        <div class="event-likes">235 сохранили</div>-->
          <div class="event-likes">{{ likesCount || 0 }} сохранили</div>
        </div>



        <div class="event-desc">
          {{currentCard.event_weekday}},
          {{format(new Date(currentCard.event_date), "d MMMM", { locale: ru })}}, {{currentCard.event_time}} GMT+3</div>
        <div class="event-desc">{{currentCard.event_location}}</div>



        <div  class="buttons-container">
              <button class="share-button2" @click.stop="shareEvent(currentCard.event_id)">
                <img src="/icons/share_button.svg" alt="Поделиться" />
              </button>


              <button class="share-button2" @click.stop="backEvent()">
                <img src="/icons/back_button.svg" alt="Поделиться" />
              </button>

        </div>

      </div>


    </div>
  </div>
</template>

<script setup lang="ts">


import { ref, computed } from 'vue';
import './assets/swiper.css';
import {useWebApp} from "vue-tg";
import { v5 as uuidv5 } from 'uuid';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCardBackground } from '~/composables/useCardBackground'


import { useRouter } from 'vue-router';


interface Event {
  event_id: number;
  event_name: string;
  event_time: string;
  event_date: string;
  event_weekday: string;
  event_banner: string;
  event_desc: string;
  event_location: string;
  event_host: string;
}

interface Response {
  success?: boolean
  error?: string
}

const startX = ref(0);
const currentX = ref(0);
const isDragging = ref(false);


const currentCard = ref<Event | null>(null);
const nextCard = ref<Event | null>(null);
const previousCard = ref<Event | null>(null);

const likesCount = ref(0);

const {
  dominantColor,
  gradientBackgroundColor,
  getAverageColor,
  gradientBackground
} = useCardBackground()


// Стили активной карточки
const activeStyle = computed(() => ({
  transform: `translateX(${currentX.value}px) rotate(${currentX.value / 10}deg)`,
  transition: isDragging.value ? 'none' : '0.3s',
}));

const mergedStyle = computed(() => ({
  ...activeStyle.value,
  background: gradientBackgroundColor.value
}));




const loadCard = async (eventId: number | null, direction: 'next' | 'prev' | 'current') => {
  try {
    const result = await $fetch('/api/loadCard', {
      method: 'POST',
      body: {
        eventId,
        direction,
      }
    })

    return result
  } catch (err) {
    console.error(`Ошибка загрузки (${direction}):`, err)
    return null
  }
}

const loadLikesCount = async (eventId) => {
  if (!eventId) return;

  try {
    const response = await $fetch('/api/getEventLikes', {
      method: 'POST',
      body: { event_id: eventId }
    });

    if (response.error) {
      console.error('Ошибка при загрузке количества лайков:', response.error);
      return;
    }

    likesCount.value = response.count;
  } catch (err) {
    console.error('Ошибка запроса количества лайков:', err);
  }
};

const initCards = async (event_id) => {



  previousCard.value = null;

  if (event_id) {
    currentCard.value = await loadCard(event_id, 'current');
  } else {
    currentCard.value = await loadCard(null, 'next');
  }

  if (currentCard.value) {
    nextCard.value = await loadCard(currentCard.value.event_id, 'next');
    await loadLikesCount(currentCard.value.event_id);
  }

};




// const swipeCard = async (direction: 'left' | 'right') => {
//   if (!currentCard.value) return
const swipeCard = async (direction) => {
  try {
    const { initDataUnsafe } = useWebApp();
    const user_id = initDataUnsafe?.user?.id;

    if (!user_id) {
      console.error('Ошибка: нет user_id')
      return
    }

    // Отправка свайпа на сервер
    const response = await $fetch<Response>('/api/swapEvent', {
      method: 'POST',
      body: {
        user_id,
        event_id: currentCard.value.event_id,
        direction
      }
    })

    if (response.error) {
      console.error('Ошибка при свайпе:', response.error)
    } else {
      console.log('Свайп сохранён')

      await recalculateFavorites(user_id)
      localStorage.setItem('last_event_id', nextCard.value.event_id.toString())
    }
  } catch (err) {
    console.error('Ошибка отправки запроса:', err)
  }

  // Переключаем карточки
  previousCard.value = currentCard.value
  currentCard.value = nextCard.value
  nextCard.value = await loadCard(currentCard.value?.event_id || null, 'next')


  // Обновляем количество лайков для новой карточки
  if (currentCard.value) {
    await loadLikesCount(currentCard.value.event_id);
  }

  dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
  gradientBackgroundColor.value = await gradientBackground()
}



const backEvent = async () => {
  if (!previousCard.value) {
    console.warn("Нет предыдущей карточки");
    return;
  }


  nextCard.value = currentCard.value;
  currentCard.value = previousCard.value;
  previousCard.value = await loadCard(previousCard.value.event_id, 'prev');


};

// Начало перетаскивания
const startDrag = (event) => {
  isDragging.value = true;
  startX.value = event.touches ? event.touches[0].clientX : event.clientX;
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
};

// Перетаскивание
const drag = (event) => {
  if (!isDragging.value) return;
  currentX.value =
      (event.touches ? event.touches[0].clientX : event.clientX) - startX.value;
};


// Завершение перетаскивания
const endDrag = () => {
  if (!isDragging.value) return;

  isDragging.value = false;

  // Проверяем, был ли свайп достаточно длинным
  if (Math.abs(currentX.value) > 40) {
    swipeCard(currentX.value > 0 ? 'right' : 'left');
  }

  // Сбрасываем положение текущей карточки
  currentX.value = 0;

  // Удаляем слушатели
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchend', endDrag);
};


const generateUniqueId = (user_id, event_id, timestamp) => {
  const namespace = '6baё7b810-9dad-11d1-80b4-00c04fd430c8'; // Уникальный namespace
  const data = `${user_id}_${event_id}_${timestamp}`;
  return uuidv5(data, namespace);
};

const route = useRoute();

// Загружаем карточки при монтировании компонента
onMounted(async () => {


  // Отключаем скролл
  document.body.style.overflow = 'hidden';

  // последняя карточка, которую видел пользователь
  const savedEventId = localStorage.getItem('last_event_id');


  if (route.query.scrollTo) {
    await initCards(route.query.scrollTo)
  } else {
    await initCards(parseInt(savedEventId));
  }


  dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
  gradientBackgroundColor.value = await gradientBackground();


});


const shareEvent = (card) => {
  const eventUrl = `@board_mini_app_bot`;
  const text =  ``;
  // const text = `Посмотри это мероприятие: ${card.event_name}`;

  // Ссылка для открытия Telegram
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`;

  // Открыть Telegram с указанной ссылкой
  window.open(telegramShareUrl, '_blank');
};


const router = useRouter();
const goToEvent = (id: number) => {
  router.push(`/event/${id}`);
};



// При клике свайпе вправо/влево надо добавлять или удалять favorites
const recalculateFavorites = async (userId: string) => {
  try {
    const response = await $fetch<Response>('/api/recalculateFavorites', {
      method: 'POST',
      body: {
        user_id: userId
      }
    })

    if (response.error) {
      console.error('Ошибка пересчёта избранного:', response.error)
    } else {
      console.log('Избранное пересчитано успешно!')
    }
  } catch (err) {
    console.error('Ошибка при запросе пересчёта избранного:', err)
  }
}



</script>

<style scoped>

</style>
