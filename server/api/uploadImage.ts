// server/api/upload-image.ts
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const form = await readMultipartFormData(event)
    const file = form?.find(f => f.name === 'file')

    if (!file) {
        return { error: 'Файл не найден' }
    }

    const fileName = `events/event_${randomUUID()}`

    const { error } = await supabase.storage
        .from('Board storage')
        .upload(fileName, file.data, {
            contentType: file.type,
            upsert: true
        })

    if (error) return { error: error.message }

    const { data: publicUrl } = supabase.storage
        .from('Board storage')
        .getPublicUrl(fileName)

    return { url: publicUrl?.publicUrl || '' }
})
