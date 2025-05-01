<template>

  <div class="month-container">
    <span class="month">{{ currentMonth }}</span>
  </div>
  <header class="header">



    <div class="dates-container">
      <!-- Отображаем текущий месяц -->
      <div
          class="date-item"
          v-for="(date, index) in dates"
          :key="index"
          :class="{ 'selected-date': date.day === selectedDate }"
          @click="selectDate(date.day)"
      >
        <span class="date-number">{{ date.day }}</span>
      </div>


    </div>
  </header>
</template>

<script setup lang="ts">
import { ru } from 'date-fns/locale';
import { ref } from 'vue';
import { format, addDays } from 'date-fns';


// Получаем текущий месяц
const currentMonth = ref(
    format(new Date(), 'LLLL', { locale: ru }).replace(/^./, (c) => c.toUpperCase())
);

// Генерация массива дат на ближайшие 10 дней
const dates = ref(
    Array.from({ length: 20 }, (_, i) => {
      const currentDate = addDays(new Date(), i);
      return {
        day: format(currentDate, 'dd', { locale: ru }),
        weekday: format(currentDate, 'EEEE', { locale: ru }),
      };
    })
);

// Устанавливаем первую дату по умолчанию
const selectedDate = ref(dates.value[0].day);

// Функция для выбора даты
const selectDate = (day: string) => {
  selectedDate.value = day;
};



</script>

<style scoped>
.header {
  background-color: #000000;
  color: white;
  padding: 5px 0;
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  z-index: 1;
  flex-direction: column; /* Размещаем элементы вертикально */
}

.dates-container {
  display: flex;
  gap: 0;
  padding: 0 0;
  width: 100%;
  height: 5vh;
}

.date-item {
  text-align: center;
  flex-shrink: 0;
  min-width: 50px;
}

.date-number {
  font-size: 17px;
}

.month-container {

  font-size: 18px;
  text-align: left;
  width: 100%;
  height: 3vh;
  margin-bottom: 0; /* Отступ между месяцем и датами */
  padding-top: 5px;
}

.month {
  font-size: 13px;
  padding: 12px;
  color: #BCBCBC;
  margin-bottom: auto;

}

/* Стилизуем выбранную дату */
.selected-date {
  color: #B3F93F;
  padding: 0;
  margin: 0;
  gap: 0;

}

</style>
