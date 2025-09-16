module.exports = {
    PORT: process.env.PORT || 3002,
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'http://localhost:3003/webhook',
    VALID_CITIES: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
    TIMEOUT: 5000
};