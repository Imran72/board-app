export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  return {
    hasSupabaseUrl: !!config.supabaseUrl,
    hasSupabaseKey: !!config.supabaseKey,
    supabaseUrlLength: config.supabaseUrl?.length || 0,
    supabaseKeyLength: config.supabaseKey?.length || 0,
    timestamp: new Date().toISOString()
  };
});
