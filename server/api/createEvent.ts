// server/api/createEvent.ts
import { createClient } from '@supabase/supabase-js'
import {timestamp} from "@antfu/utils";


const FORBIDDEN_KEYWORDS = ["курение", "кальян", "вейп", "наркотики", "алкоголь"];
const FORBIDDEN_PLACES = ["бар", "клуб", "паб", "рюмочная", "кальянная"];
const FORBIDDEN_LINKS = ["instagram.com", "facebook.com", "twitter.com"];

const containsForbiddenWords = (text: string, wordList: string[]): boolean => {
    const lowerCaseText = text.toLowerCase();
    return wordList.some(word => lowerCaseText.includes(word));
};

export default defineEventHandler(async (event) => {

    const config = useRuntimeConfig()
    const supabase = createClient(config.supabaseUrl, config.supabaseKey)

    const body = await readBody(event)

    // Проверка на запрещенные слова
    const eventText = `${body.event_name} ${body.event_description}`.toLowerCase();
    const locationText = body.event_location.toLowerCase();

    if (containsForbiddenWords(eventText, FORBIDDEN_KEYWORDS) || containsForbiddenWords(locationText, FORBIDDEN_PLACES)) {
        setResponseStatus(event, 400);
        return { error: 'Мероприятие содержит недопустимые слова или относится к запрещенному типу заведения.' };
    }

    const days = [
        "воскресенье", "понедельник", "вторник",
        "среда", "четверг", "пятница", "суббота"
    ];

    const date = new Date(body.event_start_dttm);
    const weekdayRu = days[date.getDay()]; // вернёт название на русском

    const { error } = await supabase.from('alter_events').insert([
        {
            user_id: body.user_id,
            event_name: body.event_name,
            event_date: date,
            event_banner: body.event_banner,
            event_desc: body.event_description,
            event_category: 'Хобби',
            event_time: body.event_start_dttm,
            event_location: body.event_location,
            event_host: 'Anonymous',
            event_weekday: weekdayRu,
            favorites_count: 0,
            status: 'pending'
        }
    ])

    if (error) {
        return { error: error.message }
    }

    return { success: true }
})