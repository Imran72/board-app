import supabase from '../../utils/supabaseClient';

console.log('📁 [API] Файл /api/users/check.ts загружен');

export default defineEventHandler(async (event) => {
  console.log('🚀 [API] /api/users/check вызван');
  console.log('🔍 [API] Метод запроса:', getMethod(event));
  
  // Проверяем, что это POST запрос
  if (getMethod(event) !== 'POST') {
    console.log('❌ [API] Неверный метод:', getMethod(event));
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed. Use POST.',
    });
  }

  try {
    console.log('🔧 [API] Создаем Supabase клиент...');
    const client = await supabase(event);
    console.log('✅ [API] Supabase клиент создан успешно');
    
    const body = await readBody(event);
    console.log('📦 [API] Body получен:', body);

    const userId = body.user_id;
    const userData = body.user_data;

    console.log('🔍 [API] Извлеченные данные:', { userId, userData });

    if (!userId) {
      console.log('❌ [API] user_id отсутствует в body');
      throw createError({
        statusCode: 400,
        statusMessage: 'user_id is required',
      });
    }

    console.log('🔍 [API] Проверяем существование пользователя:', userId);
    
    // Проверяем, существует ли пользователь
    const { data: existingUser, error: fetchError } = await client
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    console.log('📊 [API] Результат проверки:', { existingUser, fetchError });

    // PGRST116 = "0 rows" - это нормально, когда пользователь не найден
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [API] Ошибка при проверке пользователя:', fetchError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error checking user',
      });
    }

    // Если пользователь уже существует, ничего не делаем
    if (existingUser) {
      console.log('✅ [API] Пользователь уже существует:', userId);
      return { statusCode: 200, message: 'User already exists' };
    }

    console.log('🆕 [API] Создаем нового пользователя:', userId);
    
    // Если пользователя нет, создаем нового
    const { error: insertError } = await client.from('users').insert({
      user_id: userId,
      user_name: userData?.username || `user_${userId}`,
      user_first_name: userData?.first_name || '',
      user_last_name: userData?.last_name || '',
      user_created_date: new Date().toISOString(),
    });

    console.log('📝 [API] Результат создания:', { insertError });

    if (insertError) {
      console.error('❌ [API] Ошибка при создании пользователя:', insertError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error creating user',
      });
    }

    console.log('✅ [API] Пользователь успешно создан:', userId);
    return { statusCode: 201, message: 'User created successfully' };
  } catch (e: any) {
    console.error('💥 [API] Исключение при работе с пользователем:', e);
    console.error('💥 [API] Stack trace:', e.stack);
    throw createError({
      statusCode: 500,
      statusMessage: `Server error: ${e.message}`,
    });
  }
});
