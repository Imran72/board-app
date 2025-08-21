// server/api/createEvent.ts
import supabase from '../utils/supabaseClient';

const FORBIDDEN_KEYWORDS = ["курение", "кальян", "вейп", "наркотики", "алкоголь"];
const FORBIDDEN_PLACES = ["бар", "клуб", "паб", "рюмочная", "кальянная"];
const FORBIDDEN_LINKS = ["instagram.com", "facebook.com", "twitter.com"];

const containsForbiddenWords = (text: string, wordList: string[]): boolean => {
    const lowerCaseText = text.toLowerCase();
    return wordList.some(word => lowerCaseText.includes(word));
};

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const body = await readBody(event);

  try {
    const { data, error } = await client
      .from('events_raw')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Ошибка при создании события:', error);
      throw createError({
        statusCode: 500,
        message: `Ошибка при создании события: ${error.message}`,
      });
    }

    return { success: true, data };
  } catch (e: any) {
    console.error('Исключение при создании события:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка сервера: ${e.message}`,
    });
  }
});