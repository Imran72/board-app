// /server/api/deleteEvent.ts
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

    console.log('deleteEvent: Deleting event for user_id:', user_id, 'event_id:', event_id);

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
        console.error(`deleteEvent: Exception during user lookup (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          userError = { message: 'Exception during user lookup', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (userError || !userData) {
      console.error('deleteEvent: User not found:', userError);
      return { error: 'Не удалось найти пользователя', success: false };
    }
    
    const userName = userData.user_name;
    console.log('deleteEvent: Found user_name:', userName);

    // 2. Проверяем принадлежность события
    let eventCheck, eventCheckError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events')
          .select('event_id')
          .eq('event_id', event_id)
          .eq('event_host', userName)
          .single();
        
        eventCheck = result.data;
        eventCheckError = result.error;
        break;
      } catch (err) {
        attempts++;
        console.error(`deleteEvent: Exception during event ownership check (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          eventCheckError = { message: 'Exception during event ownership check', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (eventCheckError && eventCheckError.code !== 'PGRST116') {
      console.error('deleteEvent: Error checking event ownership:', eventCheckError);
      return { error: `Ошибка проверки принадлежности события: ${eventCheckError.message}`, success: false };
    }

    if (!eventCheck) {
      console.log('deleteEvent: User is not owner of this event');
      return { error: 'Пользователь не является организатором этого события', success: false };
    }

    // 3. Сначала удаляем связанные записи из user_favorites
    let deleteFavoritesResult, deleteFavoritesError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('user_favorites')
          .delete()
          .eq('event_id', event_id);
        
        deleteFavoritesResult = result.data;
        deleteFavoritesError = result.error;
        break;
      } catch (err) {
        attempts++;
        console.error(`deleteEvent: Exception during user_favorites deletion (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          deleteFavoritesError = { message: 'Exception during user_favorites deletion', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (deleteFavoritesError) {
      console.error('deleteEvent: Error deleting user_favorites:', deleteFavoritesError);
      return { error: `Ошибка при удалении избранных событий: ${deleteFavoritesError.message}`, success: false };
    }

    console.log('deleteEvent: Successfully deleted user_favorites');

    // 4. Затем удаляем связанные записи из events_stats
    let deleteStatsResult, deleteStatsError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events_stats')
          .delete()
          .eq('event_id', event_id);
        
        deleteStatsResult = result.data;
        deleteStatsError = result.error;
        break;
      } catch (err) {
        attempts++;
        console.error(`deleteEvent: Exception during events_stats deletion (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          deleteStatsError = { message: 'Exception during events_stats deletion', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (deleteStatsError) {
      console.error('deleteEvent: Error deleting events_stats:', deleteStatsError);
      return { error: `Ошибка при удалении статистики события: ${deleteStatsError.message}`, success: false };
    }

    console.log('deleteEvent: Successfully deleted events_stats');

    // 5. Удаляем связанные записи из events_raw (если есть)
    let deleteRawResult, deleteRawError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        // Получаем event_name для поиска в events_raw
        const eventNameResult = await supabase
          .from('events')
          .select('event_name')
          .eq('event_id', event_id)
          .eq('event_host', userName)
          .single();
        
        if (eventNameResult.data?.event_name) {
          const result = await supabase
            .from('events_raw')
            .delete()
            .eq('event_name', eventNameResult.data.event_name)
            .eq('user_id', user_id);
          
          deleteRawResult = result.data;
          deleteRawError = result.error;
        } else {
          deleteRawError = null; // Нет события для удаления
        }
        break;
      } catch (err) {
        attempts++;
        console.error(`deleteEvent: Exception during events_raw deletion (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          deleteRawError = { message: 'Exception during events_raw deletion', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (deleteRawError) {
      console.error('deleteEvent: Error deleting events_raw:', deleteRawError);
      // Не возвращаем ошибку, так как events_raw может не существовать
      console.log('deleteEvent: Warning: Could not delete from events_raw, continuing...');
    } else {
      console.log('deleteEvent: Successfully deleted events_raw entries');
    }

    // 6. Теперь удаляем само событие
    let deleteResult, deleteError;
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await supabase
          .from('events')
          .delete()
          .eq('event_id', event_id)
          .eq('event_host', userName);
        
        deleteResult = result.data;
        deleteError = result.error;
        break;
      } catch (err) {
        attempts++;
        console.error(`deleteEvent: Exception during event deletion (attempt ${attempts}):`, err);
        
        if (attempts >= maxAttempts) {
          deleteError = { message: 'Exception during event deletion', code: 'EXCEPTION' };
        } else {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (deleteError) {
      console.error('deleteEvent: Error deleting event:', deleteError);
      return { error: `Ошибка удаления события: ${deleteError.message}`, success: false };
    }

    console.log('deleteEvent: Successfully deleted event and all related data from all tables');
    return { success: true, error: null };

  } catch (error) {
    console.error('deleteEvent: Unexpected error:', error);
    setResponseStatus(event, 500);
    return { error: 'Internal server error', success: false };
  }
});
