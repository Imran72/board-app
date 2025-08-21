<template>
  <div class="swipe-container">
    <div v-if="currentCard" class="card" :style="mergedStyle" @mousedown="startDrag" @touchstart="startDrag"
      @click="goToEvent(currentCard.event_id)">
      <img :src="currentCard.event_banner" alt="Event Banner" class="card-image" />
      <div class="organizer-tag">
        <img src="/icons/user_icon.svg" alt="Organizer" class="organizer-icon" />
        <span>{{ getOrganizerName(currentCard) }}</span>
      </div>
      <div class="card-info">
        <div class="event-name">{{ currentCard.event_name }}</div>
        <div v-if="currentCard && Number(currentCard.favorites_count) > 0" class="likes-container">
          <div class="event-likes">{{ formattedLikes }} сохранили</div>
        </div>
        <div class="event-desc" v-if="currentCard.event_date">
          {{ displayWeekday }}, {{ format(parse(currentCard.event_date, 'yyyy-MM-dd', new Date()), "d MMMM", { locale: ru }) }},
          {{ currentCard.event_time }} GMT+3
        </div>
        <div class="event-desc">{{ currentCard.event_location }}</div>
        <div class="buttons-container-new">
          <button class="button-new secondary" @click.stop="swipeCard('left')">Скип</button>
          <button class="button-new secondary" @click.stop="backEvent()"><img src="/icons/back_button.svg" alt="Назад" class="button-icon" /></button>
          <button class="button-new secondary" @click.stop="swipeCard('right')">Иду</button>
        </div>
      </div>
    </div>
    <div v-else class="loading-container">
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, watch, nextTick } from 'vue';
import '~/assets/swiper.css';
import { useWebApp } from "vue-tg";
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCardBackground } from '~/composables/useCardBackground';
import { useRouter, useRoute } from 'vue-router';

// --- Props для получения фильтров ---
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({ tags: [], dates: [] })
  }
});

// --- Интерфейсы и переменные (остаются без изменений) ---
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
  organizer?: {
    user_name: string;
  };
}

const startX = ref(0);
const currentX = ref(0);
const isDragging = ref(false);
const currentCard = ref<Event | null>(null);
const nextCard = ref<Event | null>(null);
const previousCard = ref<Event | null>(null);
const loadingMessage = ref('Загрузка событий...');
const { dominantColor, gradientBackgroundColor, getAverageColor, gradientBackground } = useCardBackground();

const formattedLikes = computed(() => {
  const likes = Number(currentCard.value?.favorites_count) || 0;
  return likes.toLocaleString('ru-RU');
});

const shortWeekdays: Record<string, string> = {
  понедельник: 'Пн',
  вторник: 'Вт',
  среда: 'Ср',
  четверг: 'Чт',
  пятница: 'Пт',
  суббота: 'Сб',
  воскресенье: 'Вс',
};

const displayWeekday = computed(() => {
  const w = (currentCard.value?.event_weekday || '').toLowerCase();
  return shortWeekdays[w] || currentCard.value?.event_weekday || '';
});

const activeStyle = computed(() => ({
  transform: `translateX(${currentX.value}px) rotate(${currentX.value / 10}deg)`,
  transition: isDragging.value ? 'none' : '0.3s',
}));

const mergedStyle = computed(() => ({
  ...activeStyle.value,
  background: gradientBackgroundColor.value
}));


// --- Функции загрузки и свайпа (остаются без изменений) ---
const loadCard = async (eventId: string | null, direction: 'next' | 'prev' | 'current', isLoop: boolean = false) => {
  try {
    const result = await $fetch<Event | null>('/api/loadCard', {
      method: 'POST',
      body: { eventId, direction, filters: props.filters, isLoop }
    });
    return result;
  } catch (err) {
    console.error(`Ошибка загрузки (${direction}):`, err);
    return null;
  }
};


const initCards = async (event_id: string | null, isLoop: boolean = false) => {
  // Проверяем, инициализирован ли пользователь
  const isUserInitialized = useState('isUserInitialized');
  if (!isUserInitialized.value) {
    console.log('Пользователь не инициализирован, ждем...');
    loadingMessage.value = 'Ожидание инициализации...';
    return;
  }

  loadingMessage.value = 'Загрузка событий...';
  currentCard.value = null;
  previousCard.value = null;
  
  const card = await loadCard(event_id, event_id ? 'current' : 'next', isLoop);
  currentCard.value = card;

  // Если переданный event_id устарел или отсутствует в БД,
  // пробуем загрузить первую доступную карточку и очищаем сохраненный ID
  if (!currentCard.value && event_id) {
    try { localStorage.removeItem('last_event_id'); } catch {}
    const fallbackCard = await loadCard(null, 'next', isLoop);
    currentCard.value = fallbackCard;
  }

  if (currentCard.value) {
    nextCard.value = await loadCard(currentCard.value.event_id, 'next');
    if (!nextCard.value) {
      nextCard.value = await loadCard(null, 'next', true);
    }
  } else {
    loadingMessage.value = 'Нет событий по вашим фильтрам.';
  }
};

const swipeCard = async (direction: 'left' | 'right') => {

  if (!currentCard.value) return;

  try {
    const { initDataUnsafe } = useWebApp();
    const user_id = initDataUnsafe?.user?.id;
    if (!user_id) {
      console.error('Ошибка: нет user_id');
      return;
    }

    if (direction === 'right') {
      const resp = await $fetch<any>('/api/toggleFavorite', {
        method: 'POST',
        body: {
          user_id,
          event_id: currentCard.value.event_id,
          action: 'save'
        }
      });
      if (resp && typeof resp.favorites_count !== 'undefined' && currentCard.value) {
        currentCard.value.favorites_count = String(resp.favorites_count);
      }
    }

    if (nextCard.value) {
      localStorage.setItem('last_event_id', nextCard.value.event_id);
    }
  } catch (err) {
    console.error('Ошибка при свайпе:', err);
  }

  previousCard.value = currentCard.value;
  currentCard.value = nextCard.value;

  if (currentCard.value) {
    nextCard.value = await loadCard(currentCard.value.event_id, 'next');
    if (!nextCard.value) {
      console.log("Достигнут конец списка, зацикливаем...");
      nextCard.value = await loadCard(null, 'next', true);
    }
    if (currentCard.value.event_banner) {
      dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
      gradientBackgroundColor.value = await gradientBackground();
    }
  } else {
    loadingMessage.value = 'Перезагрузка ленты...';
    await initCards(null, true);
  }
};

const backEvent = async () => {
  if (!previousCard.value) {
    console.warn("Нет предыдущей карточки");
    return;
  }

  nextCard.value = currentCard.value;
  currentCard.value = previousCard.value;

  if (currentCard.value) {
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


// --- НОВАЯ, ИСПРАВЛЕННАЯ ЛОГИКА ---

// Отслеживаем изменения фильтров и перезагружаем карточки
watch(() => props.filters, async () => {
  // Запускаем initCards без ID, чтобы применить новые фильтры
  await initCards(null); 
  if (currentCard.value && currentCard.value.event_banner) {
    dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
    gradientBackgroundColor.value = await gradientBackground();
  }
}, { deep: true });

// Отслеживаем инициализацию пользователя
const isUserInitialized = useState('isUserInitialized');
watch(isUserInitialized, async (initialized) => {
  if (initialized) {
    console.log('Пользователь инициализирован, загружаем данные...');
    await initCards(null);
    if (currentCard.value && currentCard.value.event_banner) {
      dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
      gradientBackgroundColor.value = await gradientBackground();
    }
  }
}, { immediate: true });

const route = useRoute();
onMounted(async () => {
  document.body.style.overflow = 'hidden';

  // 2. ЖДЕМ СЛЕДУЮЩЕГО "ТИКА"
  // Это даст Vue время, чтобы обновить props, полученные от родителя
  await nextTick();

  // 3. ТЕПЕРЬ ЗАПУСКАЕМ ПЕРВУЮ ЗАГРУЗКУ
  // В этот момент props.filters уже будут содержать актуальные начальные значения
  const savedId = localStorage.getItem('last_event_id');
  const initialEventId = (route.query.scrollTo as string) || savedId;
  await initCards(initialEventId);
  if (currentCard.value && currentCard.value.event_banner) {
    dominantColor.value = await getAverageColor(currentCard.value.event_banner) as { r: number, g: number, b: number };
    gradientBackgroundColor.value = await gradientBackground();
  }
});


const router = useRouter();
const goToEvent = (id: string) => {
  if (!id) return;
  router.push(`/event/${id}`);
};

// Функция для получения никнейма организатора
const getOrganizerName = (card: Event | null) => {
  if (!card) return '';
  
  if (card.organizer && card.organizer.user_name) {
    return card.organizer.user_name;
  }
  
  // Fallback на ID если данных об организаторе нет
  return `ID: ${card.event_host}`;
};
</script>

<style scoped>
.swipe-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}
.card {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 420px;
  max-height: 95%;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  background-size: cover;
  background-position: center;
}
.loading-container {
  color: white;
  text-align: center;
}
</style>