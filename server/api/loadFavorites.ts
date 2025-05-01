// server/api/load-favorites.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { user_id } = await readBody(event)
  const config = useRuntimeConfig()
  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase
    .from('user_favorites')
    .select('event_id, event_name, event_banner, event_host, event_date, event_time, event_location')
    .eq('user_id', user_id)

  if (error) return { error: error.message }
  return { data }
})
