import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { event_id } = await readBody(event)
    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    // Log the incoming event_id
    // console.log('Getting likes count for event_id:', event_id);

    // First, verify the event exists
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('event_id')
        .eq('event_id', event_id)
        .single();

    if (eventError) {
        console.error('Error verifying event:', eventError);
        return { error: 'Event not found' };
    }

    // Get the unique likes count using a subquery
    const { data, error, count } = await supabase
        .from('user_events')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .eq('status', 'liked')
        .order('user_id', { ascending: true });

    if (error) {
        console.error('Error getting likes count:', error);
        return { error: error.message };
    }

    // Get unique users count
    const { data: uniqueUsers, error: uniqueError } = await supabase
        .from('user_events')
        .select('user_id')
        .eq('event_id', event_id)
        .eq('status', 'liked')
        .order('user_id', { ascending: true });

    if (uniqueError) {
        console.error('Error getting unique users:', uniqueError);
        return { error: uniqueError.message };
    }

    // Count unique users
    const uniqueCount = new Set(uniqueUsers?.map(item => item.user_id)).size;

    // Log the count we're getting
    console.log('Unique likes count for event', event_id, ':', uniqueCount);

    return { count: uniqueCount || 0 };
})