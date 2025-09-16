module.exports = {
    PORT: process.env.PORT || 3003,
    API_URL: process.env.API_URL || 'http://localhost:3004/api/temperature',
    TIMEOUT: 10000,
    VALID_CITIES: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
    TEMPERATURE_RANGE: {
        MIN: -50,
        MAX: 60
    }
};