import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => { // создает Nuxt плагин, который выполняется на каждой странице
    if (process.client) { // проверяет, что код выполняется на клиенте (не на сервере)
        nuxtApp.hook('page:finish', () => {
            const route = nuxtApp.$router.currentRoute.value;
            const startapp = route.query.startapp || route.query.tgWebAppStartParam || route.query.start_param;
            console.log('[startapp-redirect] route:', route.fullPath, 'startapp:', startapp);
            if (startapp && typeof startapp === 'string') {
                const eventId = startapp.replace('event_', '');
                if (eventId && !route.path.startsWith(`/event/${eventId}`)) {
                    console.log('[startapp-redirect] redirecting to', `/event/${eventId}`);
                    nuxtApp.$router.replace({
                        path: `/event/${eventId}`,
                        query: { fromShare: 'true' }
                    });
                }
            }
        });
    }
});