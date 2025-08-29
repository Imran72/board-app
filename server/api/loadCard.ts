// /server/api/loadCard.ts
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  try {
    const { eventId, direction } = await readBody(event);
    
    // Проверяем валидность параметров
    if (!direction || !['current', 'next', 'prev'].includes(direction)) {
      console.error('loadCard: Неверный direction:', direction);
      setResponseStatus(event, 400);
      return { error: 'Invalid direction parameter' };
    }
    
    const config = useRuntimeConfig();
    
    if (!config.supabaseUrl || !config.supabaseKey) {
      console.error('Missing Supabase configuration');
      setResponseStatus(event, 500);
      return { error: 'Database configuration error' };
    }
    
    const supabase = createClient(config.supabaseUrl as string, config.supabaseKey as string);
    
    console.log('loadCard: Request params:', { eventId, direction, hasConfig: !!config.supabaseUrl });

    let query;
    const currentEventId = eventId ? String(eventId) : null;

    // Теперь мы запрашиваем все поля (*) из таблицы events без лишних соединений
    const baseQuery = supabase.from('events').select('*');

    if (direction === 'current' && currentEventId) {
      query = baseQuery.eq('event_id', currentEventId).limit(1);
    } else if (direction === 'next') {
      let nextQuery = baseQuery.order('event_id', { ascending: true });
      if (currentEventId) {
        nextQuery = nextQuery.gt('event_id', currentEventId);
      }
      query = nextQuery.limit(1);
    } else { // direction === 'prev'
      let prevQuery = baseQuery.order('event_id', { ascending: false });
      if (currentEventId) {
        prevQuery = prevQuery.lt('event_id', currentEventId);
      }
      query = prevQuery.limit(1);
    }

    if (!query) {
      console.error('loadCard: Query не определен для direction:', direction);
      setResponseStatus(event, 500);
      return { error: 'Invalid query direction' };
    }

    console.log('loadCard: Выполняем запрос для direction:', direction);
    const { data, error } = await query.single();
    console.log('loadCard: Результат запроса:', { hasData: !!data, hasError: !!error, errorCode: error?.code });

    if (error) {
      if (error.code === 'PGRST116') {
        // Это нормальная ошибка "no rows returned"
        console.log('loadCard: No rows found for direction:', direction);
      } else {
        console.error('Supabase query error:', error.message, error.code);
        setResponseStatus(event, 500);
        return { error: `Database query error: ${error.message}` };
      }
    }

    // Логика зацикливания остается
    if (!data && direction === 'next') {
      console.log('loadCard: Trying fallback for next direction');
      const { data: fallback, error: fallbackError } = await supabase.from('events').select('*').order('event_id', { ascending: true }).limit(1).single();
      console.log('loadCard: Fallback next result:', { hasFallback: !!fallback, hasError: !!fallbackError });
      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
      }
      return fallback || null;
    }
    if (!data && direction === 'prev' && currentEventId) {
      console.log('loadCard: Trying fallback for prev direction');
      const { data: fallback, error: fallbackError } = await supabase.from('events').select('*').order('event_id', { ascending: false }).limit(1).single();
      console.log('loadCard: Fallback prev result:', { hasFallback: !!fallback, hasError: !!fallbackError });
      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
      }
      return fallback || null;
    }

    return data || null;
  } catch (error) {
    console.error('loadCard: Unexpected error:', error);
    setResponseStatus(event, 500);
    return { error: 'Internal server error' };
  }
});