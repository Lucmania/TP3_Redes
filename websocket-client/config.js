module.exports = {
    WS_SERVER_URL: process.env.WS_SERVER_URL || 'ws://localhost:3002',
    CITIES: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
    GENERATION_INTERVAL: 5000, // 5 segundos
    PRODUCTION_INTERVAL: 30 * 60 * 1000 // 30 minutos para producción
};