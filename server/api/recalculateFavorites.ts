// server/api/recalculateFavorites.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const body = await readBody(event)
    const { user_id } = body

    if (!user_id) {
        return { error: 'Missing user_id' }
    }

    const { error } = await supabase.rpc('recalculate_favorites', {
        submitted_user_id: user_id.toString()
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
})
