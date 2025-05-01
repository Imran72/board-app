// server/api/swap-event.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const body = await readBody(event)
    const { user_id, event_id, direction } = body

    const user_event_id = `${user_id}_${event_id}_${Date.now()}`

    const { error } = await supabase.from('user_events').insert([{
        user_event_id,
        user_id,
        event_id,
        status: direction === 'right' ? 'liked' : 'disliked',
        creation_dttm: new Date().toISOString(),
    }])

    if (error) {
        return { error: error.message }
    }

    // Если нужно, можешь сразу вызывать RPC или считать избранное
    return { success: true }
})
