// server/api/loadFavorites.ts
import supabase from '../utils/supabaseClient'

export default defineEventHandler(async (event) => {
  const { user_id } = await readBody(event);
  const client = await supabase(event);

  const { data, error } = await client
    .from('user_favorites')
    .select(`
      events:event_id(
        event_id, 
        event_name, 
        event_date, 
        event_time, 
        event_location, 
        event_host, 
        event_banner, 
        in_moderation,
        organizer:users!events_event_host_fkey(user_name)
      )
    `)
    .eq('user_id', user_id)

  if (error) {
    console.error('Ошибка при загрузке избранного:', error.message);
    setResponseStatus(event, 500);
    return { error: error.message };
  }

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

  const favorites = (data || [])
    .map((row: any) => row.events)
    .filter((e: any) => e && e.in_moderation === false)
    .map((e: any) => ({
      ...e,
      event_banner: toPublicUrl(e.event_banner),
      event_weekday_short: weekdayRuShort(e.event_date)
    }))

  // Возвращаем данные под правильным ключом 'data'
  return { data: favorites };
})