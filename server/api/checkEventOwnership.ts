// /server/api/checkEventOwnership.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // Увеличиваем таймаут для всего обработчика
  const timeout = setTimeout(() => {
    console.log('checkEventOwnership: Request timeout after 30 seconds');
  }, 30000);
  
  try {
    const config = useRuntimeConfig()
    
    if (!config.supabaseUrl || !config.supabaseKey) {
      console.error('Missing Supabase configuration');
      setResponseStatus(event, 500);
      return { error: 'Database configuration error' };
    }
    
    const supabase = createClient(config.supabaseUrl as string, config.supabaseKey as string)
    const { user_id, event_id } = await readBody(event);

    if (!user_id || !event_id) {
      setResponseStatus(event, 400);
      return { error: 'user_id and event_id are required' };
    }

    console.log('checkEventOwnership: Checking ownership for user_id:', user_id, 'event_id:', event_id);
    console.log('checkEventOwnership: Note: events_raw table has "id" column (not "event_id")');

    // 1. Сначала получаем user_name, так как он используется как event_host
    let userData, userError;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('users')
          .select('user_name')
          .eq('user_id', user_id)
          .single();
        
        userData = result.data;
        userError = result.error;
        break; // Успешно, выходим из цикла
      } catch (err) {
        attempts++;
        console.error(`checkEventOwnership: Exception during user lookup (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          userError = { message: 'Exception during user lookup', code: 'EXCEPTION' };
        } else {
          // Ждем перед повторной попыткой (экспоненциальная задержка)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (userError || !userData) {
      console.error('checkEventOwnership: User not found:', userError);
      return { error: 'Не удалось найти пользователя', isOwner: false };
    }
    
    const userName = userData.user_name;
    console.log('checkEventOwnership: Found user_name:', userName);

    // 2. Проверяем, является ли пользователь организатором в основной таблице events
    let publishedEvent, publishedError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events')
          .select('event_id, event_host')
          .eq('event_id', event_id)
          .eq('event_host', userName)
          .single();
        
        publishedEvent = result.data;
        publishedError = result.error;
        break; // Успешно, выходим из цикла
      } catch (err) {
        attempts++;
        console.error(`checkEventOwnership: Exception during published events check (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          publishedError = { message: 'Exception during published events check', code: 'EXCEPTION' };
        } else {
          // Ждем перед повторной попыткой (экспоненциальная задержка)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (publishedError && publishedError.code !== 'PGRST116') {
      console.error('checkEventOwnership: Error checking published events:', publishedError);
      return { error: `Ошибка проверки опубликованных событий: ${publishedError.message}`, isOwner: false };
    }

    if (publishedEvent) {
      console.log('checkEventOwnership: User is owner of published event');
      return { isOwner: true, eventType: 'published' };
    }

    // 3. Проверяем, является ли пользователь организатором в таблице events_raw
    // Сначала получаем название события из основной таблицы для сравнения
    let eventInfo, eventInfoError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events')
          .select('event_name')
          .eq('event_id', event_id)
          .single();
        
        eventInfo = result.data;
        eventInfoError = result.error;
        break; // Успешно, выходим из цикла
      } catch (err) {
        attempts++;
        console.error(`checkEventOwnership: Exception during event info lookup (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          eventInfoError = { message: 'Exception during event info lookup', code: 'EXCEPTION' };
        } else {
          // Ждем перед повторной попыткой (экспоненциальная задержка)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (eventInfoError && eventInfoError.code !== 'PGRST116') {
      console.error('checkEventOwnership: Error getting event info:', eventInfoError);
      return { error: `Ошибка получения информации о событии: ${eventInfoError.message}`, isOwner: false };
    }

    if (eventInfo) {
      // Теперь ищем событие с таким же названием в events_raw
      let rawEvents, rawError;
      attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const result = await supabase
            .from('events_raw')
            .select('id, event_name, user_id')
            .eq('user_id', user_id)
            .eq('event_name', eventInfo.event_name);
          
          rawEvents = result.data;
          rawError = result.error;
          break; // Успешно, выходим из цикла
        } catch (err) {
          attempts++;
          console.error(`checkEventOwnership: Exception during raw events check (attempt ${attempts}):`, err);
          
          if (attempts >= maxAttempts) {
            rawError = { message: 'Exception during raw events check', code: 'EXCEPTION' };
          } else {
            // Ждем перед повторной попыткой (экспоненциальная задержка)
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          }
        }
      }

      if (rawError) {
        console.error('checkEventOwnership: Error checking raw events:', rawError);
        return { error: `Ошибка проверки событий на модерации: ${rawError.message}`, isOwner: false };
      }

      if (rawEvents && rawEvents.length > 0) {
        console.log('checkEventOwnership: User is owner of raw event with same name');
        return { isOwner: true, eventType: 'raw' };
      }
    }

    console.log('checkEventOwnership: User is not owner of this event');
    return { isOwner: false, eventType: null };

  } catch (error) {
    console.error('checkEventOwnership: Unexpected error:', error);
    setResponseStatus(event, 500);
    return { error: 'Internal server error', isOwner: false };
  } finally {
    clearTimeout(timeout);
  }
});
