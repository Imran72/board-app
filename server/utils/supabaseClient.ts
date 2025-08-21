import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  const supabaseUrl = config.supabaseUrl;
  const supabaseKey = config.supabaseKey;
  
  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase configuration is missing',
    });
  }
  
  return createClient(supabaseUrl, supabaseKey);
});
