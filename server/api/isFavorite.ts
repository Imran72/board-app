// server/api/isFavorite.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const { user_id, event_id } = await readBody(event);
  const client = await supabase(event);

  console.log('isFavorite API вызван с:', { user_id, event_id });

  if (!user_id || !event_id) {
    throw createError({
      statusCode: 400,
      message: 'user_id и event_id обязательны',
    });
  }

  try {
    // Проверяем таблицу user_favorites, где хранятся только актуальные лайки
    const { data, error } = await client
      .from('user_favorites')
      .select('event_id')
      .eq('user_id', user_id)
      .eq('event_id', event_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена - пользователь не добавил в избранное
        return { isFavorite: false };
      }
      throw error;
    }

    // Запись найдена - пользователь добавил в избранное
    return { isFavorite: true };

  } catch (e: any) {
    console.error('Ошибка при проверке избранного:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка базы данных: ${e.message}`,
    });
  }
});