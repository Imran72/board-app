// server/api/load-top-events.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);

  const { user_id } = await readBody(event)

  // Приоритет: персональный топ (join с events, фильтр по in_moderation=false)
  let { data, error } = await client
    .from('user_events_top')
    .select(`
          events:event_id ( 
            event_id, 
            event_name, 
            event_host, 
            event_date, 
            event_time, 
            event_location, 
            event_banner, 
            in_moderation,
            organizer:users!events_event_host_fkey(user_name)
          )
        `)
        .eq('user_id', user_id)

    if (error) return { error: error.message }


    const cfg: any = useRuntimeConfig(event)
    const toPublicUrl = (banner: string) => {
      if (!banner) return banner
      if (/^https?:\/\//.test(String(banner))) return banner
      const key = String(banner).replace(/^\//, '')
      const bucket = 'Board storage'
      return `${cfg.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${key}`
    }

    const weekdayRuShort = (dateStr: string | null | undefined): string => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const map = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
      return map[d.getDay()] || ''
    }

    const userTop = (data || [])
      .map((row: any) => row.events)
      .filter((e: any) => e && e.in_moderation === false)
      .map((e: any) => ({ ...e, event_banner: toPublicUrl(e.event_banner), event_weekday_short: weekdayRuShort(e.event_date) }))

    if (userTop.length > 0) {
      return { data: userTop, source: 'user' }
    }

    // Фолбэк: дефолтный топ (join с events)
    const fallback = await client
      .from('events_default_top')
      .select(`
        events:event_id ( 
          event_id, 
          event_name, 
          event_host, 
          event_date, 
          event_time, 
          event_location, 
          event_banner, 
          in_moderation,
          organizer:users!events_event_host_fkey(user_name)
        )
      `)
      .limit(10)

    const defaultTop = (fallback.data || [])
      .map((row: any) => row.events)
      .filter((e: any) => e && e.in_moderation === false)
      .map((e: any) => ({ ...e, event_banner: toPublicUrl(e.event_banner), event_weekday_short: weekdayRuShort(e.event_date) }))

    return { data: defaultTop, source: 'default' }
})
