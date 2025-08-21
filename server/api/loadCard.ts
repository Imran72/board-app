import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const { eventId, direction, filters, isLoop } = await readBody(event); 

  const { tags, dates } = filters || { tags: [], dates: [] };
  const today = new Date().toISOString().split('T')[0];

  const weekdayRuFull = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const map = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    return map[d.getDay()] || '';
  };
  const weekdayRuShort = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const map = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    return map[d.getDay()] || '';
  };

  let eventIdsFromTags: number[] | null = null;

  // --- ✅ НОВАЯ ЛОГИКА ФИЛЬТРАЦИИ ПО ТЕГАМ ---
  if (tags && tags.length > 0) {
    // 1. Находим ID тегов по их именам
    const { data: tagIdsData, error: tagIdsError } = await client
      .from('ref_tags')
      .select('tag_id')
      .in('tag_name', tags);

    if (tagIdsError || !tagIdsData || tagIdsData.length === 0) {
      // Если теги не найдены, возвращаем null, так как событий не будет
      return null;
    }
    const tagIds = tagIdsData.map(t => t.tag_id);

    // 2. Находим ID событий, связанных с этими тегами
    const { data: eventIdsData, error: eventIdsError } = await client
      .from('event_tags')
      .select('event_id')
      .in('tag_id', tagIds);

    if (eventIdsError || !eventIdsData || eventIdsData.length === 0) {
      // Если события с такими тегами не найдены, возвращаем null
      return null;
    }
    eventIdsFromTags = eventIdsData.map(e => e.event_id);
  }

  // --- Ветка 1: Когда фильтры пустые — используем простую, надёжную навигацию по event_id ---
  const noFilters = (!tags || tags.length === 0) && (!dates || dates.length === 0) && !eventIdsFromTags;

  let data, error;
  if (noFilters) {
    const base = client
      .from('events')
      .select('*')
      .eq('in_moderation', false)
      .gte('event_date', today);
    if (isLoop) {
      ({ data, error } = await base.order('event_id', { ascending: true }).limit(1).single());
    } else if (direction === 'current' && eventId) {
      ({ data, error } = await base.eq('event_id', eventId).limit(1).single());
    } else if (direction === 'next') {
      let q = base.order('event_id', { ascending: true });
      if (eventId) q = q.gt('event_id', eventId);
      ({ data, error } = await q.limit(1).single());
    } else {
      // prev
      let q = base.order('event_id', { ascending: false });
      if (eventId) q = q.lt('event_id', eventId);
      ({ data, error } = await q.limit(1).single());
    }
  } else {
    // --- Ветка 2: Когда есть фильтры (теги/даты) — используем текущую логику по дате/времени ---
    let builder = client
      .from('events')
      .select('*')
      .eq('in_moderation', false)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });

    if (eventIdsFromTags) {
      builder = builder.in('event_id', eventIdsFromTags);
    }
    if (dates && dates.length > 0) {
      builder = builder.in('event_date', dates);
    }

    if (isLoop) {
      ({ data, error } = await builder.limit(1).single());
    } else if (direction === 'next') {
      if (eventId) {
        const currentEventResponse = await client
          .from('events')
          .select('event_date, event_time')
          .eq('event_id', eventId)
          .single();
        if (currentEventResponse.data) {
          const { event_date, event_time } = currentEventResponse.data;
          builder = builder.or(
            `event_date.gt.${event_date},and(event_date.eq.${event_date},event_time.gt.${event_time})`
          );
        }
      }
      ({ data, error } = await builder.limit(1).single());
    } else if (direction === 'prev') {
      if (eventId) {
        const currentEventResponse = await client
          .from('events')
          .select('event_date, event_time')
          .eq('event_id', eventId)
          .single();
        if (currentEventResponse.data) {
          const { event_date, event_time } = currentEventResponse.data;
          builder = builder
            .order('event_date', { ascending: false })
            .order('event_time', { ascending: false })
            .or(`event_date.lt.${event_date},and(event_date.eq.${event_date},event_time.lt.${event_time})`);
        }
      }
      ({ data, error } = await builder.limit(1).single());
    } else if (direction === 'current' && eventId) {
      ({ data, error } = await client
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .single());
    } else {
      ({ data, error } = await builder.limit(1).single());
    }
  }

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Ошибка при загрузке карточки:', error);
    }
    return null;
  }

  // Дополняем вычисленным днем недели
  if (data) {
    // Загружаем данные пользователя отдельно
    if (data.event_host) {
      try {
        const { data: userData, error: userError } = await client
          .from('users')
          .select('user_name')
          .eq('user_id', data.event_host)
          .single()

        if (userError) {
          console.error('Ошибка при загрузке пользователя:', userError);
        } else {
          console.log('Данные пользователя:', userData);
          // Добавляем данные пользователя к событию
          (data as any).organizer = userData;
        }
      } catch (e) {
        console.error('Исключение при загрузке пользователя:', e);
      }
    }
    
    if (!(data as any).event_weekday) {
      (data as any).event_weekday = weekdayRuFull((data as any).event_date);
    }
    (data as any).event_weekday_short = weekdayRuShort((data as any).event_date);
  }

  // Зацикливание, если ничего не нашли
  if (!data) {
    if (direction === 'next') {
      const { data: fallback } = await client
        .from('events')
        .select('*')
        .order('event_id', { ascending: true })
        .limit(1)
        .single();
      if (fallback) {
        // Загружаем данные пользователя для fallback
        if (fallback.event_host) {
          try {
            const { data: userData, error: userError } = await client
              .from('users')
              .select('user_name')
              .eq('user_id', fallback.event_host)
              .single()

            if (!userError && userData) {
              (fallback as any).organizer = userData;
            }
          } catch (e) {
            console.error('Исключение при загрузке пользователя для fallback:', e);
          }
        }
        
        if (!(fallback as any).event_weekday) {
          (fallback as any).event_weekday = weekdayRuFull((fallback as any).event_date);
        }
        (fallback as any).event_weekday_short = weekdayRuShort((fallback as any).event_date);
      }
      return fallback || null;
    }
    if (direction === 'prev') {
      const { data: fallback } = await client
        .from('events')
        .select('*')
        .order('event_id', { ascending: false })
        .limit(1)
        .single();
      if (fallback) {
        // Загружаем данные пользователя для fallback
        if (fallback.event_host) {
          try {
            const { data: userData, error: userError } = await client
              .from('users')
              .select('user_name')
              .eq('user_id', fallback.event_host)
              .single()

            if (!userError && userData) {
              (fallback as any).organizer = userData;
            }
          } catch (e) {
            console.error('Исключение при загрузке пользователя для fallback:', e);
          }
        }
        
        if (!(fallback as any).event_weekday) {
          (fallback as any).event_weekday = weekdayRuFull((fallback as any).event_date);
        }
        (fallback as any).event_weekday_short = weekdayRuShort((fallback as any).event_date);
      }
      return fallback || null;
    }
  }

  return data;
});
