// /server/api/loadMyEvents.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const { user_id } = await readBody(event);

  if (!user_id) {
    throw createError({
      statusCode: 400,
      message: 'user_id обязателен',
    });
  }

  try {
    const { data, error } = await client
      .from('events_raw')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка при загрузке событий:', error);
      throw createError({
        statusCode: 500,
        message: `Ошибка при загрузке событий: ${error.message}`,
      });
    }

    return { data };
  } catch (e: any) {
    console.error('Исключение при загрузке событий:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка сервера: ${e.message}`,
    });
  }
});