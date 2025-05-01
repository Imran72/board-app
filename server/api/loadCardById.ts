// server/api/load-card-by-id.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const { data, error } = await supabase
        .from('events')
        .select('event_id, event_name, event_host, event_date, event_time, event_location, event_banner, event_desc')
        .eq('event_id', id)
        .single()

    if (error) return { error: error.message }
    return { data }
})
