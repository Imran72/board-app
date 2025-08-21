// /server/api/recalculateFavorites.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);

  try {
    // Получаем все события
    const { data: events, error: eventsError } = await client
      .from('events')
      .select('event_id');

    if (eventsError) {
      throw createError({
        statusCode: 500,
        message: `Ошибка при получении событий: ${eventsError.message}`,
      });
    }

    // Для каждого события пересчитываем количество избранного
    for (const event of events || []) {
      const { count, error: countError } = await client
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.event_id);

      if (countError) {
        console.warn(`Ошибка при подсчете для события ${event.event_id}:`, countError);
        continue;
      }

      // Обновляем счетчик
      const { error: updateError } = await client
        .from('events')
        .update({ favorites_count: count || 0 })
        .eq('event_id', event.event_id);

      if (updateError) {
        console.warn(`Ошибка при обновлении счетчика для события ${event.event_id}:`, updateError);
      }
    }

    return { success: true, message: 'Счетчики избранного пересчитаны' };
  } catch (e: any) {
    console.error('Исключение при пересчете избранного:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка сервера: ${e.message}`,
    });
  }
});