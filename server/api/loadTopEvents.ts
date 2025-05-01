// server/api/load-top-events.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { user_id } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    let { data, error } = await supabase
        .from('user_events_top')
        .select('event_id, event_name, event_host, event_date, event_time, event_location, event_banner')
        .eq('user_id', user_id)

    if (error) return { error: error.message }

    if (!data || data.length === 0) {
        const fallback = await supabase
            .from('events_default_top')
            .select('event_name, event_host, event_date, event_time, event_location, event_banner')
            .limit(10)

        return { data: fallback.data || [], source: 'default' }
    }

    return { data, source: 'user' }
})
