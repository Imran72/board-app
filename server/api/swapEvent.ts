// server/api/swap-event.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const { eventId1, eventId2 } = await readBody(event);

  if (!eventId1 || !eventId2) {
    throw createError({
      statusCode: 400,
      message: 'eventId1 и eventId2 обязательны',
    });
  }

  try {
    // Получаем оба события
    const { data: event1, error: error1 } = await client
      .from('events')
      .select('*')
      .eq('event_id', eventId1)
      .single();

    const { data: event2, error: error2 } = await client
      .from('events')
      .select('*')
      .eq('event_id', eventId2)
      .single();

    if (error1 || error2) {
      throw createError({
        statusCode: 500,
        message: 'Ошибка при получении событий',
      });
    }

    // Меняем местами
    const { error: updateError1 } = await client
      .from('events')
      .update({ event_id: eventId2 })
      .eq('event_id', eventId1);

    const { error: updateError2 } = await client
      .from('events')
      .update({ event_id: eventId1 })
      .eq('event_id', eventId2);

    if (updateError1 || updateError2) {
      throw createError({
        statusCode: 500,
        message: 'Ошибка при обмене событий',
      });
    }

    return { success: true };
  } catch (e: any) {
    console.error('Исключение при обмене событий:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка сервера: ${e.message}`,
    });
  }
});
