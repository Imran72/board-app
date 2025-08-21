<template>
  <div class="header-wrapper">
    <div class="month-container">
      <span class="month">{{ currentMonth }}</span>
    </div>

    <header class="header">
      <div class="dates-container">
        <button
          v-for="date in availableDates"
          :key="date.iso"
          @click="handleDateClick(date.iso)"
          :class="['date-button', { active: activeDates.includes(date.iso) }]"
        >
          {{ date.day }}
        </button>
      </div>

      <div class="tags-container">
        <button
          @click="handleTagClick('Все')"
          :class="['tag-button', 'all-button', { active: activeTags.length === 0 }]"
        >
          Все
        </button>
        
        <div v-if="tagsPending">Загрузка тегов...</div>
        <div v-else-if="tagsError">Ошибка загрузки</div>

        <button
          v-else
          v-for="tag in availableTags"
          :key="tag.tag_name"
          @click="handleTagClick(tag.tag_name)"
          :class="['tag-button', { active: activeTags.includes(tag.tag_name) }]"
          :style="{ 
            backgroundColor: activeTags.includes(tag.tag_name) ? '#B3F93F' : tag.color_hex
          }"
        >
          {{ tag.tag_name }}
        </button>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
// --- ВЕСЬ БЛОК SCRIPT ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
import { ref, watch, onMounted, computed } from 'vue';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const emit = defineEmits(['filters-changed']);

const activeTags = ref<string[]>([]);
const activeDates = ref<string[]>([]);

interface Tag {
  tag_name: string;
  color_hex: string;
}

// Проверяем инициализацию пользователя перед загрузкой тегов
const isUserInitialized = useState('isUserInitialized');
const availableTags = ref<Tag[]>([]);
const tagsPending = ref(false);
const tagsError = ref<Error | null>(null);

// Загружаем теги только после инициализации пользователя
watch(isUserInitialized, async (initialized) => {
  if (initialized) {
    console.log('Загружаем теги...');
    tagsPending.value = true;
    try {
      const tags = await $fetch<Tag[]>('/api/tagsGet');
      availableTags.value = tags;
    } catch (err) {
      console.error('Ошибка загрузки тегов:', err);
      tagsError.value = err as Error;
    } finally {
      tagsPending.value = false;
    }
  }
}, { immediate: true });

const handleTagClick = (tagName: string) => {
  if (tagName === 'Все') {
    activeTags.value = [];
    return;
  }
  const index = activeTags.value.indexOf(tagName);
  if (index > -1) {
    activeTags.value.splice(index, 1);
  } else {
    activeTags.value.push(tagName);
  }
};

const availableDates = ref<{ day: string; iso: string }[]>([]);

const currentMonth = computed(() =>
  format(new Date(), 'LLLL', { locale: ru }).replace(/^./, (c) => c.toUpperCase())
);

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i);
    dates.push({
      day: format(date, 'd'),
      iso: format(date, 'yyyy-MM-dd'),
    });
  }
  availableDates.value = dates;
};

const handleDateClick = (isoDate: string) => {
  const index = activeDates.value.indexOf(isoDate);
  if (index > -1) {
    activeDates.value.splice(index, 1);
  } else {
    activeDates.value.push(isoDate);
  }
};

watch([activeTags, activeDates], () => {
  emit('filters-changed', {
    tags: activeTags.value,
    dates: activeDates.value,
  });
}, { deep: true });

onMounted(() => {
  generateDates();
  // Инициируем стартовые фильтры, чтобы дочерние получили первый emit
  emit('filters-changed', {
    tags: activeTags.value,
    dates: activeDates.value,
  });
});
</script>

<style scoped>
/* Стили, которые не менялись, я оставил как есть */
.header-wrapper {
  background-color: #000;
  font-family: 'Inter', sans-serif;
}
.month-container {
  font-size: 18px;
  text-align: left;
  width: 100%;
  height: 3vh;
  margin-bottom: 0;
  padding-top: 5px;
}
.month {
  font-size: 13px;
  padding: 12px;
  color: #BCBCBC;
}
.header {
  color: white;
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.header::-webkit-scrollbar { display: none; }
.dates-container, .tags-container {
  display: flex;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  padding-left: 16px;
  padding-right: 20px;
  align-items: center;
}
.dates-container::-webkit-scrollbar, .tags-container::-webkit-scrollbar { display: none; }
.dates-container {
  gap: 0;
  padding: 0 12px;
  width: 95%;
  height: 5vh;
  margin-bottom: 10px;
}

.date-button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: center;
  flex-shrink: 0;
  min-width: 50px;
  font-size: 17px;
  color: #8e8e93;
  
  font-weight: normal; 
  
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-button.active {
  color: #B3F93F;
  font-weight: bold;
}

.tags-container {
  padding: 0 12px;
  min-height: 44px;
}

.tag-button {
  display: flex;
  align-items: center;
  color: #000; 
  border: 1px solid transparent;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;
  font-weight: 600; 
}

.tag-button.active {
  background-color: #B3F93F;
  color: #000;
  border-color: #B3F93F;
}

.tags-container .tag-button:first-child {
    background-color: #f2f2f7;
    color: #000;
    border-color: #f2f2f7;
}
.tags-container .tag-button:first-child.active {
    background-color: #B3F93F;
    color: #000;
}
</style>