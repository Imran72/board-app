// /server/api/getEventForEdit.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
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

    console.log('getEventForEdit: Getting event data for user_id:', user_id, 'event_id:', event_id);

    // 1. Проверяем, является ли пользователь организатором события
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
        break;
      } catch (err) {
        attempts++;
        console.error(`getEventForEdit: Exception during user lookup (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          userError = { message: 'Exception during user lookup', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (userError || !userData) {
      console.error('getEventForEdit: User not found:', userError);
      return { error: 'Не удалось найти пользователя', data: null };
    }
    
    const userName = userData.user_name;
    console.log('getEventForEdit: Found user_name:', userName);

    // 2. Получаем данные события и проверяем принадлежность
    let eventData, eventError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events')
          .select('*')
          .eq('event_id', event_id)
          .eq('event_host', userName)
          .single();
        
        eventData = result.data;
        eventError = result.error;
        break;
      } catch (err) {
        attempts++;
        console.error(`getEventForEdit: Exception during event lookup (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          eventError = { message: 'Exception during event lookup', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('getEventForEdit: Error getting event data:', eventError);
      return { error: `Ошибка получения данных события: ${eventError.message}`, data: null };
    }

    if (!eventData) {
      console.log('getEventForEdit: User is not owner of this event');
      return { error: 'Пользователь не является организатором этого события', data: null };
    }

    console.log('getEventForEdit: Successfully retrieved event data for editing');
    return { data: eventData, error: null };

  } catch (error) {
    console.error('getEventForEdit: Unexpected error:', error);
    setResponseStatus(event, 500);
    return { error: 'Internal server error', data: null };
  }
});
