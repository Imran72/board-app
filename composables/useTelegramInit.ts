// composables/useTelegramInit.ts
import { ref, onMounted } from 'vue';
import { useWebApp } from 'vue-tg';

export const useTelegramInit = () => {
  const isTelegramReady = ref(false);
  const isInitializing = ref(true);
  const userData = ref<any>(null);
  const error = ref<string | null>(null);
  const hasInitialized = ref(false); // Флаг для предотвращения повторной инициализации

  const initTelegram = async () => {
    // Если уже инициализировали, не делаем это снова
    if (hasInitialized.value && isTelegramReady.value) {
      console.log('Telegram уже инициализирован, пропускаем повторную инициализацию');
      return;
    }
    
    try {
      isInitializing.value = true;
      error.value = null;

      // Сначала проверяем, может быть Telegram уже готов
      const { initDataUnsafe } = useWebApp();
      
      if (initDataUnsafe?.user?.id) {
        // Telegram уже готов, не ждем
        userData.value = initDataUnsafe.user;
        isTelegramReady.value = true;
        hasInitialized.value = true;
        console.log('Telegram Web App уже готов:', userData.value);
        
        // Расширяем приложение
        try {
          if ((window as any).Telegram?.WebApp?.expand) {
            (window as any).Telegram.WebApp.expand();
          }
        } catch (e) {
          console.log('Не удалось расширить приложение:', e);
        }
        
        isInitializing.value = false;
        return;
      }

      // Если не готов, ждем инициализации
      console.log('Telegram Web App не готов, ждем инициализации...');
      await waitForTelegramReady();
      
      // Повторно получаем данные после ожидания
      const { initDataUnsafe: newInitData } = useWebApp();
      
      if (newInitData?.user?.id) {
        userData.value = newInitData.user;
        isTelegramReady.value = true;
        hasInitialized.value = true;
        console.log('Telegram Web App инициализирован после ожидания:', userData.value);
        
        // Расширяем приложение
        try {
          if ((window as any).Telegram?.WebApp?.expand) {
            (window as any).Telegram.WebApp.expand();
          }
        } catch (e) {
          console.log('Не удалось расширить приложение:', e);
        }
      } else {
        throw new Error('Данные пользователя не получены от Telegram после ожидания');
      }

    } catch (err: any) {
      error.value = err.message || 'Ошибка инициализации Telegram Web App';
      console.error('Ошибка инициализации Telegram:', err);
      isTelegramReady.value = false;
    } finally {
      isInitializing.value = false;
    }
  };

  const waitForTelegramReady = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // Максимум 5 секунд (50 * 100ms)
      
      const checkTelegram = () => {
        attempts++;
        
        try {
          const { initDataUnsafe } = useWebApp();
          
          if (initDataUnsafe?.user?.id) {
            console.log('Telegram Web App готов на попытке:', attempts);
            resolve();
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Telegram Web App не инициализирован в течение 5 секунд'));
            return;
          }
          
          // Проверяем каждые 100ms
          setTimeout(checkTelegram, 100);
        } catch (err) {
          if (attempts >= maxAttempts) {
            reject(err);
          } else {
            setTimeout(checkTelegram, 100);
          }
        }
      };
      
      checkTelegram();
    });
  };

  onMounted(() => {
    // Инициализируем только если еще не инициализировали
    if (!hasInitialized.value) {
      initTelegram();
    }
  });

  return {
    isTelegramReady,
    isInitializing,
    userData,
    error,
    hasInitialized,
    initTelegram
  };
};
