// /server/api/loadCardById.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const { eventId } = await readBody(event);

  if (!eventId) {
    setResponseStatus(event, 400);
    return { error: 'Event ID is required' };
  }

  console.log('loadCardById вызван с id:', eventId);

  // Сначала загружаем событие
  const { data: eventData, error: eventError } = await client
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single()

  if (eventError) {
      console.error('Ошибка при загрузке события:', eventError);
      setResponseStatus(event, 500);
      return { error: eventError.message }
  }

  console.log('Событие загружено:', eventData);

  // Теперь загружаем данные пользователя отдельно
  if (eventData.event_host) {
      const { data: userData, error: userError } = await client
          .from('users')
          .select('user_name')
          .eq('user_id', eventData.event_host)
          .single()

      if (userError) {
          console.error('Ошибка при загрузке пользователя:', userError);
      } else {
          console.log('Данные пользователя:', userData);
          // Добавляем данные пользователя к событию
          (eventData as any).organizer = userData;
      }
  }

  console.log('Финальные данные события:', JSON.stringify(eventData, null, 2));
  
  // Добавляем защиту на случай, если events_stats будет использоваться где-то еще
  if (eventData && !eventData.events_stats) {
      eventData.events_stats = [{ uniq_users_likes: Number(eventData.favorites_count) || 0 }];
  }

  return { data: eventData }
})