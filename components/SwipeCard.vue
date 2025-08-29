<template>
  <div class="swipe-container">
    <div v-if="currentCard" class="card" :style="mergedStyle" @mousedown="startDrag" @touchstart="startDrag"
      @click="goToEvent(currentCard.event_id)">
      <img :src="currentCard.event_banner" alt="Event Banner" class="card-image" />

      <div class="organizer-tag">
        <img src="/icons/Frame.svg" alt="Organizer" class="organizer-icon" />
        <span class="organizer-name">{{ currentCard.event_host }}</span>
      </div>

      <div class="card-info">
        <div class="event-name">{{ currentCard.event_name }}</div>

        <div class="likes-container">
          <div class="event-likes">{{ formattedLikes }} сохранили</div>
        </div>

        <div class="event-desc" v-if="currentCard.event_date">
          {{ currentCard.event_weekday }}, {{ format(parse(currentCard.event_date, 'yyyy-MM-dd', new Date()), "d MMMM",
            { locale: ru }) }},
          {{ currentCard.event_time }} GMT+3
        </div>

        <div class="event-desc">{{ currentCard.event_location }}</div>

        <div class="buttons-container-new">
          <button class="button-new secondary" @click.stop="swipeCard('left')">
            Скип
          </button>
          <button class="button-new secondary" @click.stop="backEvent()"> <img src="public/icons/back_button.svg" alt="Назад"
              class="button-icon" />
          </button>
          <button class="button-new secondary" @click.stop="swipeCard('right')">
            Иду
          </button>
        </div>
      </div>
    </div>
    <div v-else class="loading-container">
      <p>Загрузка событий...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import './assets/swiper.css';
import { useWebApp } from "vue-tg";
import { ru } from 'date-fns/locale';
import { useCardBackground } from '~/composables/useCardBackground';
import { useRouter, useRoute } from 'vue-router';
import { format, parse } from 'date-fns';
import { useTelegramInit } from '~/composables/useTelegramInit';

// Пропсы для получения отфильтрованных событий
const props = defineProps<{
  filteredEvents?: any[];
}>();



interface Event {
  event_id: string;
  event_name: string;
  event_time: string;
  event_date: string;
  event_weekday: string;
  event_banner: string;
  event_desc: string;
  event_location: string;
  event_host: string;
  favorites_count: string;
  events_stats: { uniq_users_likes: number }[];
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

const {
  dominantColor,
  gradientBackgroundColor,
  getAverageColor,
  gradientBackground
} = useCardBackground();

// Получаем данные пользователя Telegram
const { userData } = useTelegramInit();

const formattedLikes = computed(() => {
  const likes = Number(currentCard.value?.favorites_count) || 0;
  return likes.toLocaleString('ru-RU');
});

const activeStyle = computed(() => ({
  transform: `translateX(${currentX.value}px) rotate(${currentX.value / 10}deg)`,
  transition: isDragging.value ? 'none' : '0.3s',
}));

const mergedStyle = computed(() => ({
  ...activeStyle.value,
  background: gradientBackgroundColor.value
}));

const loadCard = async (eventId: string | null, direction: 'next' | 'prev' | 'current') => {
  try {
    console.log(`loadCard: Загружаем карточку direction=${direction}, eventId=${eventId}`);
    const result = await $fetch<Event | null>('/api/loadCard', {
      method: 'POST',
      body: { eventId, direction }
    });
    
    if (result && 'error' in result) {
      console.error(`loadCard: API вернул ошибку (${direction}):`, result.error);
      return null;
    }
    
    console.log(`loadCard: Успешно загружена карточка direction=${direction}:`, result?.event_name);
    return result;
  } catch (err) {
    console.error(`loadCard: Ошибка загрузки (${direction}):`, err);
    return null;
  }
};

const initCards = async (event_id: string | null) => {
  try {
    // Если передан конкретный event_id, загружаем его
    if (event_id) {
      currentCard.value = await loadCard(event_id, 'current');
      if (currentCard.value) {
        nextCard.value = await loadCard(currentCard.value.event_id, 'next');
        // Сохраняем текущую карточку в localStorage
        localStorage.setItem('last_event_id', currentCard.value.event_id);
        console.log('initCards: Загружена карточка по ID:', event_id);
      }
    } else {
      // Если event_id не передан, пытаемся восстановить из localStorage
      const lastEventId = localStorage.getItem('last_event_id');
      if (lastEventId) {
        console.log('initCards: Восстанавливаем последнюю карточку из localStorage:', lastEventId);
        currentCard.value = await loadCard(lastEventId, 'current');
        if (currentCard.value) {
          nextCard.value = await loadCard(currentCard.value.event_id, 'next');
        }
      } else {
        // Если нет сохраненной карточки, загружаем следующую
        console.log('initCards: Загружаем следующую карточку');
        currentCard.value = await loadCard(null, 'next');
        if (currentCard.value) {
          nextCard.value = await loadCard(currentCard.value.event_id, 'next');
          localStorage.setItem('last_event_id', currentCard.value.event_id);
        }
      }
    }
    
    previousCard.value = null;
  } catch (error) {
    console.error('initCards: Ошибка при инициализации карточек:', error);
    // В случае ошибки очищаем карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
  }
};

const swipeCard = async (direction: 'left' | 'right') => {
  if (!currentCard.value) return;

  try {
    const user_id = userData.value?.id;
    
    if (!user_id) {
      console.error('Ошибка: нет user_id, Telegram Web App не готов');
      return;
    }

    // Сохраняем "лайк" только при свайпе вправо
    if (direction === 'right') {
      await $fetch<Response>('/api/toggleFavorite', {
        method: 'POST',
        body: {
          user_id,
          event_id: currentCard.value.event_id,
          action: 'save'
        }
      });
    }

      // Сохраняем ID следующей карточки в localStorage
  if (nextCard.value) {
    localStorage.setItem('last_event_id', nextCard.value.event_id);
    console.log('swipeCard: Сохранена следующая карточка в localStorage:', nextCard.value.event_id);
  }
  } catch (err) {
    console.error('Ошибка при свайпе:', err);
  }

  previousCard.value = currentCard.value;
  currentCard.value = nextCard.value;

  // Если есть отфильтрованные события, работаем с ними
  if (props.filteredEvents && props.filteredEvents.length > 0) {
    console.log('swipeCard: Работаем с отфильтрованными событиями');
    const currentIndex = props.filteredEvents.findIndex(event => event.event_id === currentCard.value?.event_id);
    console.log('swipeCard: Текущий индекс в отфильтрованных событиях:', currentIndex);
    
    if (currentIndex !== -1 && currentIndex < props.filteredEvents.length - 1) {
      nextCard.value = props.filteredEvents[currentIndex + 1];
      console.log('swipeCard: Установлена следующая карточка из фильтра:', nextCard.value.event_name);
    } else {
      nextCard.value = null;
      console.log('swipeCard: Следующая карточка не найдена в фильтре');
    }
  } else {
    // Если нет отфильтрованных событий, используем стандартную логику
    console.log('swipeCard: Используем стандартную логику загрузки');
    if (currentCard.value) {
      nextCard.value = await loadCard(currentCard.value.event_id, 'next');
    }
  }

  if (currentCard.value && currentCard.value.event_banner) {
    dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
    gradientBackgroundColor.value = await gradientBackground();
  }
};

const backEvent = async () => {
  if (!previousCard.value) {
    console.warn("Нет предыдущей карточки");
    return;
  }

  // Меняем карточки местами
  nextCard.value = currentCard.value;
  currentCard.value = previousCard.value;

  if (currentCard.value) {
    // Сохраняем текущую карточку в localStorage
    localStorage.setItem('last_event_id', currentCard.value.event_id);
    console.log('backEvent: Сохранена текущая карточка в localStorage:', currentCard.value.event_id);
    
    // Загружаем новую "предыдущую" карточку
    previousCard.value = await loadCard(currentCard.value.event_id, 'prev');

    if (currentCard.value.event_banner) {
      dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
      gradientBackgroundColor.value = await gradientBackground();
    }
  }
};


const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  startX.value = 'touches' in event ? event.touches[0].clientX : event.clientX;
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
};

const drag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  currentX.value = ('touches' in event ? event.touches[0].clientX : event.clientX) - startX.value;
};

const endDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  if (Math.abs(currentX.value) > 40) {
    swipeCard(currentX.value > 0 ? 'right' : 'left');
  }
  currentX.value = 0;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchend', endDrag);
};

const route = useRoute();

// Функция для обновления фона карточки (определяем раньше)
const updateCardBackground = async () => {
  try {
    if (currentCard.value && currentCard.value.event_banner) {
      console.log('updateCardBackground: Обновляем фон для баннера:', currentCard.value.event_banner);
      dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
      gradientBackgroundColor.value = await gradientBackground();
      console.log('updateCardBackground: Фон обновлен успешно');
    }
  } catch (error) {
    console.error('updateCardBackground: Ошибка при обновлении фона:', error);
  }
};

// Функции для обработки событий в watch
const handleFilteredEvents = (events: any[]) => {
  try {
    console.log('handleFilteredEvents: Обрабатываем отфильтрованные события:', events);
    
    if (!events || events.length === 0) {
      console.log('handleFilteredEvents: Нет событий для обработки');
      return;
    }
    
    // Проверяем, что события имеют необходимые поля
    if (!events[0] || !events[0].event_id) {
      console.error('handleFilteredEvents: Первое событие не имеет event_id:', events[0]);
      return;
    }
    
    // Устанавливаем первую карточку
    currentCard.value = events[0];
    console.log('handleFilteredEvents: Установлена первая карточка:', currentCard.value.event_name, 'с датой:', currentCard.value.event_date);
    
    // Сохраняем текущую карточку в localStorage
    localStorage.setItem('last_event_id', currentCard.value.event_id);
    console.log('handleFilteredEvents: Сохранена карточка в localStorage:', currentCard.value.event_id);
    
    // Устанавливаем следующую карточку, если есть
    if (events.length > 1) {
      nextCard.value = events[1];
      console.log('handleFilteredEvents: Установлена следующая карточка:', nextCard.value.event_name, 'с датой:', nextCard.value.event_date);
    } else {
      nextCard.value = null;
      console.log('handleFilteredEvents: Следующая карточка не установлена');
    }
    
    // Предыдущей карточки нет при инициализации
    previousCard.value = null;
    
    // Обновляем фон для текущей карточки
    if (currentCard.value && currentCard.value.event_banner) {
      updateCardBackground();
    }
    
    console.log('handleFilteredEvents: Обработка завершена успешно');
  } catch (error) {
    console.error('handleFilteredEvents: Ошибка при обработке:', error);
    // В случае ошибки очищаем карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
  }
};

const handleLoadAllEvents = async () => {
  try {
    console.log('handleLoadAllEvents: Загружаем все события');
    
    // Очищаем текущие карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
    
    // Загружаем события через стандартный API
    await initCards(null);
    
    if (currentCard.value && currentCard.value.event_banner) {
      dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
      gradientBackgroundColor.value = await gradientBackground();
    }
    
    console.log('handleLoadAllEvents: Загрузка завершена');
  } catch (error) {
    console.error('handleLoadAllEvents: Ошибка при загрузке всех событий:', error);
    // В случае ошибки очищаем карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
  }
};

// Следим за изменением отфильтрованных событий
watch(() => props.filteredEvents, (newEvents) => {
  try {
    console.log('SwipeCard: filteredEvents изменился:', newEvents);
    
    if (newEvents && newEvents.length > 0) {
      // Если есть отфильтрованные события, инициализируем карточки
      console.log('SwipeCard: Инициализируем отфильтрованные события');
      handleFilteredEvents(newEvents);
    } else if (newEvents && newEvents.length === 0) {
      // Если событий нет, очищаем текущие карточки
      console.log('SwipeCard: Очищаем карточки (нет событий)');
      currentCard.value = null;
      nextCard.value = null;
      previousCard.value = null;
    } else if (!newEvents || newEvents === undefined) {
      // Если filteredEvents undefined, загружаем все события
      console.log('SwipeCard: Загружаем все события (нет фильтра)');
      handleLoadAllEvents();
    } else if (newEvents && newEvents.length === 0) {
      // Если filteredEvents пустой массив, очищаем карточки
      console.log('SwipeCard: Очищаем карточки (пустой массив)');
      currentCard.value = null;
      nextCard.value = null;
      previousCard.value = null;
    }
  } catch (error) {
    console.error('SwipeCard: Ошибка в watch функции:', error);
    // В случае ошибки очищаем карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
  }
}, { deep: true, immediate: true });

// Функция для инициализации карточек из отфильтрованных событий
const initCardsFromFiltered = (events: any[]) => {
  try {
    console.log('initCardsFromFiltered: Начинаем инициализацию с событиями:', events);
    console.log('initCardsFromFiltered: Детали событий:', events.map(e => ({
      id: e.event_id,
      name: e.event_name,
      date: e.event_date
    })));
    
    if (!events || events.length === 0) {
      console.log('initCardsFromFiltered: Нет событий для инициализации');
      return;
    }
    
    // Проверяем, что события имеют необходимые поля
    if (!events[0] || !events[0].event_id) {
      console.error('initCardsFromFiltered: Первое событие не имеет event_id:', events[0]);
      return;
    }
    
    // Устанавливаем первую карточку
    currentCard.value = events[0];
    console.log('initCardsFromFiltered: Установлена первая карточка:', currentCard.value.event_name, 'с датой:', currentCard.value.event_date);
    
    // Устанавливаем следующую карточку, если есть
    if (events.length > 1) {
      nextCard.value = events[1];
      console.log('initCardsFromFiltered: Установлена следующая карточка:', nextCard.value.event_name, 'с датой:', nextCard.value.event_date);
    } else {
      nextCard.value = null;
      console.log('initCardsFromFiltered: Следующая карточка не установлена');
    }
    
    // Предыдущей карточки нет при инициализации
    previousCard.value = null;
    
    // Обновляем фон для текущей карточки
    if (currentCard.value && currentCard.value.event_banner) {
      updateCardBackground();
    }
    
    console.log('initCardsFromFiltered: Инициализация завершена успешно');
  } catch (error) {
    console.error('initCardsFromFiltered: Ошибка при инициализации:', error);
    // В случае ошибки очищаем карточки
    currentCard.value = null;
    nextCard.value = null;
    previousCard.value = null;
  }
};



onMounted(async () => {
  document.body.style.overflow = 'hidden';
  
  // Проверяем, есть ли отфильтрованные события
  if (props.filteredEvents && props.filteredEvents.length > 0) {
    console.log('onMounted: Есть отфильтрованные события, пропускаем initCards');
    return;
  }
  
  const initialEventId = (route.query.scrollTo as string) || localStorage.getItem('last_event_id');
  await initCards(initialEventId);

  if (currentCard.value) {
    console.log('ПОЛУЧЕННАЯ ДАТА:', currentCard.value.event_date);
  } else {
    console.log('Карточка (currentCard) не загрузилась, проверьте API.');
  }

  if (currentCard.value && currentCard.value.event_banner) {
    dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
    gradientBackgroundColor.value = await gradientBackground();
  }
});

const router = useRouter();
const goToEvent = (id: string) => {
  if (!id) return;
  console.log('SwipeCard: Переходим к событию:', id);
  router.push(`/event/${id}`);
};

</script>

<style scoped>
.loading-container {
  color: rgb(255, 255, 255);
  text-align: center;
  padding-top: 50%;
}


/* 
.button-new.primary {
  background-color: #B3F93F; Яркий акцентный цвет
  color: #1a1a1a; Темный текст для контраста
} */


</style>