import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { event_id } = await readBody(event)

    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    // Проверка, существует ли событие
    const { error: eventError } = await supabase
        .from('events')
        .select('event_id')
        .eq('event_id', event_id)
        .single()

    if (eventError) {
        return { error: 'Event not found' }
    }

    // Получение количества лайков из витрины events_stats
    const { data, error } = await supabase
        .from('events_stats')
        .select('uniq_users_likes')
        .eq('event_id', event_id)
        .single()

    if (error) {
        return { error: error.message }
    }

    return { count: data?.uniq_users_likes ?? 0 }
})
