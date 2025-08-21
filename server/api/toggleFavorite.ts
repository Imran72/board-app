// /server/api/toggleFavorite.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const { user_id, event_id, action } = await readBody(event);
  const client = await supabase(event);

  if (!user_id || !event_id || !action) {
    throw createError({
      statusCode: 400,
      message: 'Отсутствует user_id, event_id или action'
    });
  }

  try {
    const uid = Number(user_id);
    const eid = Number(event_id);

    if (!Number.isFinite(uid) || !Number.isFinite(eid)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректные user_id или event_id'
      });
    }

    if (action === 'save') {
      // Делаем идемпотентно без upsert (на случай отсутствия уникального индекса)
      const { count: existsCount, error: existsError } = await client
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('event_id', eid);
      if (existsError) throw existsError;

      if (!existsCount || existsCount === 0) {
        const { error: insertError } = await client
          .from('user_favorites')
          .insert({ user_id: uid, event_id: eid });
        if (insertError) throw insertError;
      }

      // Пересчитываем счетчик избранного на основе фактического количества
      const { count, error: countError } = await client
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eid);
      if (countError) throw countError;

      // Пытаемся обновить счетчик в events (если политика позволяет)
      const { error: updateError } = await client
        .from('events')
        .update({ favorites_count: String(count || 0) })
        .eq('event_id', String(event_id));
      if (updateError) {
        // Не критично для статуса избранного
        console.warn('[toggleFavorite] Не удалось обновить favorites_count в events:', updateError.message)
      }

      return { success: true, newState: 'saved', favorites_count: count || 0 }
    } 
    
    else if (action === 'unsave') {
      // Удаляем запись из избранного (идемпотентно)
      const { error: deleteError } = await client
          .from('user_favorites')
          .delete()
          .eq('user_id', uid)
          .eq('event_id', eid)

      if (deleteError) throw deleteError;

      // Пересчитываем счетчик
      const { count, error: countError } = await client
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eid);
      if (countError) throw countError;

      const { error: updateError } = await client
        .from('events')
        .update({ favorites_count: String(count || 0) })
        .eq('event_id', String(event_id));
      if (updateError) {
        console.warn('[toggleFavorite] Не удалось обновить favorites_count в events:', updateError.message)
      }

      return { success: true, newState: 'none', favorites_count: count || 0 }
    }

    else {
      throw createError({
        statusCode: 400,
        message: `Неизвестное действие: ${action}`
      });
    }

  } catch (e: any) {
    // Улучшенная обработка ошибок
    console.error(`[toggleFavorite] Ошибка при действии "${action}" для event_id ${event_id}:`, e.message);
    throw createError({
      statusCode: 500,
      message: `Ошибка базы данных: ${e.message}`
    });
  }
})