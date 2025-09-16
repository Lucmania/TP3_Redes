module.exports = {
    PORT: process.env.PORT || 3004,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/tp3-temperatura',
    JWT_SECRET: process.env.JWT_SECRET || 'tp3-microservicios-secret-key',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3005',
    NODE_ENV: process.env.NODE_ENV || 'development'
};