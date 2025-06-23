// server/api/load-my-events.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { user_id } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const today = new Date().toISOString();

    const { data, error } = await supabase
        .from('events_raw')
        .select(`
            id,
            user_id,
            event_name,
            event_banner,
            event_start_dttm,
            event_end_dttm,
            event_location,
            event_description,
            event_moderation_step,
            created_at
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }

    // Преобразуем данные для отображения
    const formattedData = data?.map(event => ({
        event_id: event.id,
        event_name: event.event_name,
        event_banner: event.event_banner,
        event_host: '', // Пока оставляем пустым, можно добавить позже
        event_date: event.event_start_dttm ? new Date(event.event_start_dttm).toISOString().split('T')[0] : '',
        event_time: event.event_start_dttm ? new Date(event.event_start_dttm).toTimeString().slice(0, 5) : '',
        event_location: event.event_location || '',
        event_moderation_step: event.event_moderation_step || 'На модерации'
    })) || []

    return { data: formattedData }
})