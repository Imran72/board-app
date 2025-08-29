<template>
  <div class="event-page-wrapper" :style="{ background: gradientBackgroundColor }">
    <!-- Шаблон для обычных пользователей -->
    <div v-if="event" class="event-page" :class="{ 'organizer-view': isOrganizer }">
      <div class="card-container">
        <div class="card">
          <img :src="event.event_banner" alt="Event Banner" class="card-image" />
        </div>
      </div>

      <h1 class="event-title">{{ event.event_name }}</h1>
      <p class="event-date">
        {{ capitalizeMonth(event.event_date) }}, {{ event.event_time }} GMT+3
      </p>

      <!-- Дополнительные действия для организатора -->
      <div v-if="isOrganizer" class="organizer-actions">
        <div class="organizer-action-item" @click="copyEventLink">
          <img src="/icons/LinkWhite.svg" alt="Copy Link Icon" class="action-icon" />
          <span class="action-text">Скопировать ссылку на событие</span>
        </div>
        <div class="organizer-action-item" @click="createEventQRCode">
          <img src="/icons/QRcode.svg" alt="QR Code Icon" class="action-icon" />
          <span class="action-text">Создать QR-код события</span>
        </div>
      </div>

      <!-- Кнопки для обычных пользователей -->
      <div v-if="!isOrganizer" class="event-actions">
        <button
          :class="['action-button', { saved: isSaved }]"
          @click.stop="toggleSave"
          :disabled="isLoadingSave"
        >
          <img
            :src="isSaved ? '/icons/favorites-white.svg' : '/icons/favorites.svg'"
            alt="Save Icon"
            class="button-icon"
          />
          {{ isSaved ? "Сохранено" : "Сохранить" }}
        </button>
        <button class="action-button">
          <img src="public/icons/Contact.svg" alt="Contact Icon" class="button-icon" />
          <span>Контакт</span>
        </button>
        <button class="action-button" @click.stop="shareEvent">
          <img src="public/icons/Share.svg" alt="Share Icon" class="button-icon" />
          <span>Поделиться</span>
        </button>
        <button class="action-button">
          <img src="public/icons/Calendar.svg" alt="More Icon" class="button-icon" />
          <span>В календарь</span>
        </button>
      </div>

      <!-- Кнопки для организатора -->
      <div v-if="isOrganizer" class="event-actions">
        <button class="action-button" @click="startEditing">
          <img src="/icons/Edit.svg" alt="Edit Icon" class="button-icon" />
          <span>Править</span>
        </button>
        <button class="action-button">
          <img src="/icons/Check.svg" alt="Check Icon" class="button-icon" />
          <span>Отметить</span>
        </button>
        <button class="action-button" @click.stop="shareEvent">
          <img src="public/icons/Share.svg" alt="Share Icon" class="button-icon" />
          <span>Поделиться</span>
        </button>
        <button class="action-button">
          <img src="public/icons/Calendar.svg" alt="Calendar Icon" class="button-icon" />
          <span>В календарь</span>
        </button>
      </div>

      <div class="section">
        <p class="section-title">О событии</p>
        <hr class="divider" />
        <p class="section-content">{{ event.event_desc || 'Описание не указано' }}</p>
      </div>

      <!-- Ссылки -->
      <div class="section">
        <p class="section-title">Ссылки</p>
        <hr class="divider" />
        <div class="section-content">
          <a v-if="event.event_link" :href="event.event_link" target="_blank" class="event-link">{{ event.event_link }}</a>
          <span v-else class="no-data">Ссылки не указаны</span>
        </div>
      </div>

      <!-- Категория -->
      <!-- <div class="section">
        <p class="section-title">Категория</p>
        <hr class="divider" />
        <div class="section-content">
          <span v-if="event.event_category" class="event-tag category-tag">{{ event.event_category }}</span>
          <span v-else class="no-data">Категория не указана</span>
        </div>
      </div> -->

      <!-- Теги -->
      <div class="section">
        <p class="section-title">Теги</p>
        <hr class="divider" />
        <div class="section-content">
          <span v-if="event.event_tag" class="event-tag">{{ event.event_tag }}</span>
          <span v-else class="no-data">Теги не указаны</span>
        </div>
      </div>

      <!-- Локация -->
      <div class="section">
        <p class="section-title">Локация</p>
        <hr class="divider" />
        <p class="section-content">{{ event.event_location || 'Локация не указана' }}</p>
      </div>

      <!-- Организатор -->
      <div class="section">
        <p class="section-title">Организатор</p>
        <hr class="divider" />
        <div class="section-content organizer-content">
          <div class="organizer-avatar">
            <img src="/icons/Frame.svg" alt="Organizer Avatar" class="avatar-icon" />
          </div>
          <span class="organizer-name">{{ event.event_host || 'Организатор не указан' }}</span>
        </div>
      </div>

      <!-- Количество сохранивших -->
      <div class="section">
        <p class="section-title">{{ Number(event.favorites_count || 0).toLocaleString('ru-RU') }} человек сохранили</p>
        <hr class="divider" />
      </div>

      <!-- Кнопка удаления события для организатора -->
      <div v-if="isOrganizer" class="delete-button-container">
        <button class="delete-button">
          Удалить событие
        </button>
      </div>
    </div>

    <!-- Кнопка регистрации для обычных пользователей -->
    <div v-if="event && !isOrganizer" class="registration-button-container">
      <button class="registration-button">
        Регистрация
      </button>
    </div>

    <div v-if="!event" class="loading-container">
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute } from "vue-router";

import { useTelegramInit } from '~/composables/useTelegramInit';
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { usePendingFavorite } from '~/composables/usePendingFavorite';
import { useCardBackground } from '~/composables/useCardBackground';
import "./assets/event-card.css";

definePageMeta({
  layout: "card",
});

interface Event {
  event_id: string;
  event_name: string;
  event_host: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_banner: string;
  event_desc: string;
  event_category: string | null;
  event_tag: string | null;
  event_link: string | null;
  favorites_count: string; 
  events_stats: { uniq_users_likes: number }[];
}

const route = useRoute();
const event = ref<Event | null>(null);
const loadingMessage = ref("Загрузка мероприятия...");

const isSaved = ref(false);
const isLoadingSave = ref(false);
const { userData } = useTelegramInit();

// Логируем состояние Telegram Web App
console.log('Telegram Web App state:', {
  hasUserData: !!userData.value,
  userId: userData.value?.id,
  username: userData.value?.username,
  firstName: userData.value?.first_name
});

// Следим за изменением userData и проверяем принадлежность события
watch(userData, async (newUserData) => {
  if (newUserData?.id && event.value) {
    console.log('userData изменился, проверяем принадлежность события');
    await checkEventOwnership();
  }
});

const pendingAction = usePendingFavorite();

// Определяем, является ли текущий пользователь организатором
const isOrganizer = ref(false);

// Функция для проверки принадлежности события
const checkEventOwnership = async (retryCount = 0) => {
  if (!event.value || !userData.value?.id) {
    isOrganizer.value = false;
    return;
  }

  try {
    const result = await $fetch<{ isOwner: boolean; eventType?: string; error?: string }>('/api/checkEventOwnership', {
      method: 'POST',
      body: {
        user_id: userData.value.id,
        event_id: event.value.event_id
      }
    });

    if (result.error) {
      console.error('Ошибка проверки принадлежности события:', result.error);
      isOrganizer.value = false;
      return;
    }

    console.log('checkEventOwnership result:', result);
    console.log('isOrganizer set to:', result.isOwner);
    isOrganizer.value = result.isOwner;
  } catch (error) {
    console.error('Ошибка при проверке принадлежности события:', error);
    
    // Retry логика для сетевых ошибок (только для определенных типов)
    if (retryCount < 2 && error instanceof Error && 
        (error.message.includes('fetch failed') || error.message.includes('network'))) {
      console.log(`Повторная попытка ${retryCount + 1}/2 через 2 секунды...`);
      setTimeout(() => checkEventOwnership(retryCount + 1), 2000);
      return;
    }
    
    // Fallback: пытаемся определить по локальным данным
    console.log('Используем fallback проверку принадлежности');
    if (event.value.event_host && userData.value.username) {
      const isLocalOwner = event.value.event_host === userData.value.username;
      console.log('Fallback check:', { eventHost: event.value.event_host, username: userData.value.username, isOwner: isLocalOwner });
      isOrganizer.value = isLocalOwner;
    } else {
      isOrganizer.value = false;
    }
  }
};

const { dominantColor, gradientBackgroundColor, getAverageColor, gradientBackground } = useCardBackground();

const config = useRuntimeConfig();

const shareEvent = () => {
    if (!event.value) return;
    
    const config = useRuntimeConfig();
    const appBaseUrl = config.public.telegramAppUrl;

    if (!appBaseUrl) {
        console.error("URL приложения не задан в конфигурации!");
        return;
    }

    // 1. Формируем URL, который будет прикреплен к сообщению в виде кнопки-превью.
    const appUrl = `${appBaseUrl}?startapp=event-${event.value.event_id}`;

    // 2. Формируем ТОЛЬКО текст сообщения, БЕЗ ссылки.
    const text = `\nПриходи на "${event.value.event_name}" в приложении Board!`;

    // 3. Создаем URL для шаринга.
    const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
    
    (window as any).Telegram?.WebApp?.openTelegramLink(shareUrl);
};

// Функция для копирования ссылки на событие
const copyEventLink = async () => {
    if (!event.value) return;
    
    const config = useRuntimeConfig();
    const appBaseUrl = config.public.telegramAppUrl;

    if (!appBaseUrl) {
        console.error("URL приложения не задан в конфигурации!");
        return;
    }

    const eventUrl = `${appBaseUrl}?startapp=event-${event.value.event_id}`;
    
    try {
        await navigator.clipboard.writeText(eventUrl);
        console.log('Ссылка скопирована в буфер обмена');
        // Можно добавить уведомление пользователю
    } catch (err) {
        console.error('Не удалось скопировать ссылку:', err);
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = eventUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Ссылка скопирована через fallback метод');
    }
};

// Функция для создания QR-кода события
const createEventQRCode = () => {
    if (!event.value) return;
    
    const config = useRuntimeConfig();
    const appBaseUrl = config.public.telegramAppUrl;

    if (!appBaseUrl) {
        console.error("URL приложения не задан в конфигурации!");
        return;
    }

    const eventUrl = `${appBaseUrl}?startapp=event-${event.value.event_id}`;
    
    // Создаем QR-код через внешний сервис
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventUrl)}`;
    
    // Открываем QR-код в новом окне
    window.open(qrCodeUrl, '_blank');
};

// Функция для начала редактирования события
const startEditing = async () => {
    if (!event.value || !userData.value?.id) return;
    
    try {
        const result = await $fetch<{ data?: any; error?: string }>('/api/getEventForEdit', {
            method: 'POST',
            body: {
                user_id: userData.value.id,
                event_id: event.value.event_id
            }
        });

        if (result.error) {
            console.error('Ошибка получения данных для редактирования:', result.error);
            return;
        }

        if (result.data) {
            // Сохраняем данные события в localStorage для передачи в модуль создания
            const eventDataForEdit = {
                ...result.data,
                isEditing: true,
                originalEventId: event.value.event_id
            };
            
            localStorage.setItem('eventDataForEdit', JSON.stringify(eventDataForEdit));
            
            // Переходим на страницу создания события
            await navigateTo('/addEvent');
        }
    } catch (error) {
        console.error('Ошибка при получении данных для редактирования:', error);
    }
};

const checkIsFavorite = async (eventId: string) => {
    const userId = userData.value?.id;
    if (!userId) return;
    try {
        const result = await $fetch<{ isFavorite: boolean }>("/api/isFavorite", {
            method: "POST", body: { user_id: userId, event_id: eventId },
        });
        isSaved.value = result.isFavorite;
    } catch (e) { console.error("Не удалось проверить статус 'избранного'", e); }
};

const toggleSave = () => {
    if (!event.value) return;

    isSaved.value = !isSaved.value;
    if (isSaved.value) {
        if(event.value.favorites_count) {
           event.value.favorites_count = String(Number(event.value.favorites_count) + 1);
        }
    } else {
       if(event.value.favorites_count) {
           event.value.favorites_count = String(Number(event.value.favorites_count) - 1);
        }
    }
  
    pendingAction.value = {
        eventId: event.value.event_id,
        action: isSaved.value ? 'save' : 'unsave',
    };
};

const fetchEvent = async (id: string) => {
    if (!id || id === 'undefined') {
        loadingMessage.value = "Неверный ID мероприятия.";
        return;
    }
    const data = await loadCards(id);
    if (data) {
        if (!data.events_stats) {
            data.events_stats = [{ uniq_users_likes: 0 }];
        }
        
        console.log('fetchEvent: Загруженные данные события:', {
            event_id: data.event_id,
            event_host: data.event_host,
            event_host_type: typeof data.event_host,
            current_user_id: userData.value?.id,
            current_user_id_type: typeof userData.value?.id
        });
        
        event.value = data;
        await nextTick();
        
        if (data.event_banner) {
          dominantColor.value = await getAverageColor(data.event_banner) as { r: number, g: number, b: number };
          gradientBackgroundColor.value = await gradientBackground();
        }

        await checkIsFavorite(id);
        await checkEventOwnership(); // Проверяем принадлежность события
        pendingAction.value = { eventId: null, action: null };
    } else {
        loadingMessage.value = "Не удалось загрузить мероприятие.";
    }
};

onMounted(() => {
    fetchEvent(String(route.params.id));
});

// Очищаем все таймауты при размонтировании компонента
onUnmounted(() => {
    // Это поможет предотвратить утечки памяти и зависшие запросы
    console.log('Компонент размонтирован, очищаем ресурсы');
});

const shortWeekdays = { понедельник: "Пн", вторник: "Вт", среда: "Ср", четверг: "Чт", пятница: "Пт", суббота: "Сб", воскресенье: "Вс" };
const capitalizeMonth = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const fullWeekday = format(date, "EEEE", { locale: ru });
    const formattedDate = format(date, "d MMMM", { locale: ru });
    const capitalizedMonth = formattedDate.replace(/\s(\p{L})/u, (match) => match.toUpperCase());
    const shortWeekday = shortWeekdays[fullWeekday.toLowerCase()] || fullWeekday;
    return `${shortWeekday}, ${capitalizedMonth}`;
};
const loadCards = async (id: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            console.log(`loadCards: Попытка ${retryCount + 1}/${maxRetries} для события ${id}`);
            
            const response = await $fetch<{ data?: Event }>("/api/loadCardById", {
                method: "POST", 
                body: { id }
            });
            
            if (response.data) {
                // Убеждаемся, что все поля присутствуют
                const eventData = response.data;
                console.log(`loadCards: Успешно загружено событие ${id}`);
                return {
                    ...eventData,
                    event_category: eventData.event_category || null,
                    event_tag: eventData.event_tag || null,
                    event_link: eventData.event_link || null,
                    favorites_count: eventData.favorites_count || '0'
                };
            }
            
            return null;
        } catch (err) {
            retryCount++;
            console.error(`loadCards: Ошибка попытки ${retryCount}/${maxRetries}:`, err);
            
            // Проверяем тип ошибки
            if (err instanceof Error) {
                if (err.message.includes('aborted') || err.message.includes('timeout') || err.message.includes('no response')) {
                    console.log(`loadCards: Сетевая ошибка, повторная попытка через 2 секунды...`);
                    
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                }
            }
            
            // Если это последняя попытка или не сетевая ошибка, выбрасываем ошибку
            if (retryCount >= maxRetries) {
                console.error(`loadCards: Все попытки исчерпаны для события ${id}`);
                throw err;
            }
        }
    }
    
    return null;
};
</script>

<style scoped>
.event-page-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  /* Фон теперь будет динамическим, убираем статичный цвет */
  transition: background 0.5s ease;
  /* Плавный переход фона */
  font-family: 'Inter', sans-serif;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Скрываем скроллбар для всех браузеров */
.event-page-wrapper::-webkit-scrollbar {
  display: none;
}

.event-page-wrapper {
  -ms-overflow-style: none;  /* IE и Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Глобальные стили для всего текста */
.event-page {
  font-family: 'Inter', sans-serif;
  min-width: 100%;
  scroll-behavior: smooth;
  padding-bottom: 150px;
}

/* Специальные стили для названия события */
.event-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700; /* Bold */
  margin-left: 10px;
  margin-top: 0;
  padding-top: 15px;
}

/* Специальные стили для организатора */
.event-host {
  font-family: 'Inter', sans-serif;
  font-weight: 700; /* Bold */
}

.event-page {
  position: relative;
  z-index: 3;
  padding-bottom: 100px;
  font-family: 'Inter', sans-serif;
}

/* Стили для даты и времени */
.event-date {
  font-family: 'Inter', sans-serif;
  font-weight: 400; /* Regular */
  margin-left: 10px;
  margin-bottom: 5px;
}

.loading-container {
  color: white;
  text-align: center;
  padding-top: 50%;
  font-family: 'Inter', sans-serif;
  font-weight: 400; /* Regular */
}



/* Стили для контейнера кнопок действий */
.event-actions {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  padding: 0 20px;
  width: 90%;
  padding-bottom: 10px;
}

.action-button.saved {
  background-color: #5d5dff;
  color: white;
}

.button-icon {
  width: 18px;
  height: 18px;
  margin-bottom: 4px;
  /* Добавим отступ для текста под иконкой */
}

.action-button {
  flex: 1;
  flex-direction: column;
  white-space: nowrap;
  /* Иконка и текст будут друг под другом */
  font-family: 'Inter', sans-serif;
  font-weight: 400; /* Regular */
  font-size: 12px;
  min-width: 0;
  width: 100%;
}

.card-image {
  /* Убираем маску, которая создавала "засвет" */
  -webkit-mask-image: none;
  mask-image: none;
}

.event-background {
  /* Этот класс больше не используется для фона, но оставляем на случай, если он нужен для других стилей */
}

/* Стили для новых секций */
.section {
  margin: 20px 0;
  padding: 0 0px;
  color: rgba(255, 255, 255, 1); /* #FFFFFF на 100% прозрачности */
}

.section-title {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5); /* #FFFFFF на 50% прозрачности */
  margin-bottom: 10px;
}

.divider {
  border: none;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 10px auto;
  width: 92%;
  display: block;
}

.section-content {
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 1); /* #FFFFFF на 100% прозрачности */
  margin: 0;
}

.event-link {
  color: #B3F93F;
  text-decoration: none;
  word-break: break-all;
  font-family: 'Inter', sans-serif;
  font-weight: 400; /* Regular */
}

.event-link:hover {
  text-decoration: underline;
}

.event-tag {
  display: inline-block;
  background-color: #B3F93F;
  color: #000;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.category-tag {
  background-color: #6ab2f2;
  color: white;
}

.no-data {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* Стили для кнопки регистрации */
.registration-button-container {
  position: fixed;
  bottom: 30px; /* выше футера */
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 15px;
  z-index: 1000;
  width: 100%;
  display: flex;
  justify-content: center;
}

.registration-button {
  width: 360px;
  height: 50px;
  background-color: #B3F93F;
  border: none;
  border-radius: 25px;
  color: #000;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500; /* Medium */
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(179, 249, 63, 0.3);
}

.registration-button:hover {
  background-color: #9EDF2E;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(179, 249, 63, 0.4);
}

.registration-button:active {
  transform: translateY(0);
}

/* Стили для кнопки удаления события */
.delete-button-container {
  position: relative;
  margin-top: 25px;
  margin-bottom: 35px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.delete-button {
  width: 360px;
  height: 50px;
  background-color: #FCFCFC;
  border: none;
  border-radius: 25px;
  color: #000;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500; /* Medium */
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(252, 252, 252, 0.3);
}

.delete-button:hover {
  background-color: #E8E8E8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 252, 252, 0.4);
}

.delete-button:active {
  transform: translateY(0);
}

/* Стили для организатора */
.organizer-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.organizer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  width: 15px;
  height: 15px;
  object-fit: contain;
}

.organizer-name {
  font-family: 'Inter', sans-serif;
  font-weight: 600; /* Semi Bold */
  font-size: medium;
  color: rgba(255, 255, 255, 1);
}

/* Стили для дополнительных действий организатора */
.organizer-actions {
  margin: 10px 0px 20px 25px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.organizer-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.organizer-action-item:hover {
  opacity: 0.8;
}

.action-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.action-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400; /* Regular */
  font-size: 17px;
  color: rgba(255, 255, 255, 1);
}

/* Стили для организатора */
.organizer-view {
  padding-bottom: 15px; /* Больше места для кнопок */
}
</style>