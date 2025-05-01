// server/api/load-card.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { eventId, direction } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    let query

    if (direction === 'current') {
        query = supabase
            .from('events')
            .select()
            .eq('event_id', eventId)
            .limit(1)
    } else if (direction === 'next') {
        query = supabase
            .from('events')
            .select()
            .order('event_id', { ascending: true })
            .gt('event_id', eventId || 0)
            .limit(1)
    } else {
        query = supabase
            .from('events')
            .select()
            .order('event_id', { ascending: false })
            .lt('event_id', eventId ?? Number.MAX_SAFE_INTEGER)
            .limit(1)
    }

    const { data, error } = await query.single()

    if (!data && direction === 'next') {
        // Вернуть первую карточку
        const { data: fallback } = await supabase
            .from('events')
            .select()
            .order('event_id', { ascending: true })
            .limit(1)
            .single()

        return fallback || null
    }

    if (!data && direction === 'prev') {
        const { data: fallback } = await supabase
            .from('events')
            .select()
            .order('event_id', { ascending: false })
            .limit(1)
            .single()

        return fallback || null
    }

    return data || null
})
