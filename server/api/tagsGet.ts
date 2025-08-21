// File: server/api/tagsGet.ts

import supabase from '../utils/supabaseClient';

export default defineEventHandler(async (event) => {
  const client = await supabase(event);
  
  try {
    const { data, error } = await client
      .from('ref_tags')
      .select('*')
      .order('tag_name');

    if (error) {
      console.error('Ошибка при загрузке тегов:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error loading tags',
      });
    }

    return data;
  } catch (e: any) {
    console.error('Исключение при загрузке тегов:', e);
    throw createError({
      statusCode: 500,
      statusMessage: `Server error: ${e.message}`,
    });
  }
});