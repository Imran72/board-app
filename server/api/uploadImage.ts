// server/api/upload-image.ts
import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  const body = await readBody(event);

  try {
    const { data, error } = await client.storage
      .from('event-images')
      .upload(body.path, body.file, {
        contentType: body.contentType,
        upsert: true
      });

    if (error) {
      console.error('Ошибка при загрузке изображения:', error);
      throw createError({
        statusCode: 500,
        message: `Ошибка при загрузке изображения: ${error.message}`,
      });
    }

    return { success: true, data };
  } catch (e: any) {
    console.error('Исключение при загрузке изображения:', e);
    throw createError({
      statusCode: 500,
      message: `Ошибка сервера: ${e.message}`,
    });
  }
});
