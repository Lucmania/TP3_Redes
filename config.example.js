// Configuración de ejemplo para TP3 Microservicios
// Copiar este archivo como .env en cada microservicio

module.exports = {
    // ===========================================
    // CONFIGURACIÓN GENERAL
    // ===========================================
    NODE_ENV: 'development',
    
    // ===========================================
    // MONGODB CONFIGURACIÓN
    // ===========================================
    // Para MongoDB Local:
    MONGODB_URI: 'mongodb://localhost:27017/tp3-temperatura',
    
    // Para MongoDB Atlas (Cloud):
    // MONGODB_URI: 'mongodb+srv://username:password@cluster.mongodb.net/tp3-temperatura?retryWrites=true&w=majority',
    
    // ===========================================
    // JWT CONFIGURACIÓN
    // ===========================================
    JWT_SECRET: 'tp3-microservicios-secret-key-change-in-production',
    
    // ===========================================
    // WEBSOCKET CLIENT (Puerto 3001)
    // ===========================================
    WS_SERVER_URL: 'ws://localhost:3002',
    
    // ===========================================
    // WEBSOCKET SERVER (Puerto 3002)
    // ===========================================
    WS_PORT: 3002,
    WEBHOOK_URL: 'http://localhost:3003/webhook',
    
    // ===========================================
    // WEBHOOK SERVICE (Puerto 3003)
    // ===========================================
    WEBHOOK_PORT: 3003,
    API_URL: 'http://localhost:3004/api/temperature',
    
    // ===========================================
    // REST API (Puerto 3004)
    // ===========================================
    API_PORT: 3004,
    FRONTEND_URL: 'http://localhost:3005',
    
    // ===========================================
    // SPA (Puerto 3005)
    // ===========================================
    SPA_PORT: 3005,
    SPA_API_URL: 'http://localhost:3004/api',
    
    // ===========================================
    // CONFIGURACIÓN DE CIUDADES
    // ===========================================
    CITIES: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
    
    // ===========================================
    // CONFIGURACIÓN DE GENERACIÓN DE DATOS
    // ===========================================
    GENERATION_INTERVAL: 5000, // 5 segundos para testing
    PRODUCTION_INTERVAL: 30 * 60 * 1000, // 30 minutos para producción
    
    // ===========================================
    // CONFIGURACIÓN DE TEMPERATURAS
    // ===========================================
    TEMPERATURE_RANGES: {
        'Shanghai': { base: 20, variation: 15 },
        'Berlin': { base: 10, variation: 20 },
        'Rio de Janeiro': { base: 25, variation: 10 }
    },
    
    // ===========================================
    // CONFIGURACIÓN DE SEGURIDAD
    // ===========================================
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // máximo 100 requests por IP
    },
    
    // ===========================================
    // CONFIGURACIÓN DE CORS
    // ===========================================
    CORS_ORIGINS: [
        'http://localhost:3005',
        'http://localhost:3000',
        'http://127.0.0.1:3005'
    ]
};