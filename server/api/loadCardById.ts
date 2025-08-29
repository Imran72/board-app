// /server/api/loadCardById.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        const { id } = await readBody(event)
        
        if (!id) {
            setResponseStatus(event, 400);
            return { error: 'ID события не указан' }
        }
        
        const config = useRuntimeConfig()
        
        if (!config.supabaseUrl || !config.supabaseKey) {
            console.error('Missing Supabase configuration');
            setResponseStatus(event, 500);
            return { error: 'Database configuration error' };
        }
        
        const supabase = createClient(config.supabaseUrl as string, config.supabaseKey as string)
        
        console.log('loadCardById: Загружаем событие с ID:', id);
        
        // Запрашиваем все поля, включая favorites_count
        const { data, error } = await supabase
            .from('events')
            .select('*') // Просто и надежно
            .eq('event_id', id)
            .single()

        if (error) {
            console.error('loadCardById: Supabase error:', error);
            
            if (error.code === 'PGRST116') {
                // Событие не найдено
                setResponseStatus(event, 404);
                return { error: 'Событие не найдено' }
            }
            
            setResponseStatus(event, 500);
            return { error: error.message }
        }
        
        if (!data) {
            setResponseStatus(event, 404);
            return { error: 'Событие не найдено' }
        }
        
        // Добавляем защиту на случай, если events_stats будет использоваться где-то еще
        if (data && !data.events_stats) {
            data.events_stats = [{ uniq_users_likes: Number(data.favorites_count) || 0 }];
        }

        console.log('loadCardById: Событие успешно загружено:', data.event_name);
        return { data }
        
    } catch (error) {
        console.error('loadCardById: Unexpected error:', error);
        setResponseStatus(event, 500);
        return { error: 'Internal server error' }
    }
})