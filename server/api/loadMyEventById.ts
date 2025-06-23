import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

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
            event_moderation_step
        `)
        .eq('id', id)
        .single()

    if (error) return { error: error.message }

    // Преобразуем данные для отображения
    const formattedData = {
        event_id: data.id,
        event_name: data.event_name,
        event_banner: data.event_banner,
        event_host: '', // Пока оставляем пустым
        event_date: data.event_start_dttm ? new Date(data.event_start_dttm).toISOString().split('T')[0] : '',
        event_time: data.event_start_dttm ? new Date(data.event_start_dttm).toTimeString().slice(0, 5) : '',
        event_location: data.event_location || '',
        event_desc: data.event_description || '',
        event_moderation_step: data.event_moderation_step || 'На модерации'
    }

    return { data: formattedData }
}) 