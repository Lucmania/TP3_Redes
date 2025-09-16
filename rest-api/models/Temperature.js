const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    city: {
        type: String,
        required: true,
        enum: ['Shanghai', 'Berlin', 'Rio de Janeiro']
    },
    temperature: {
        type: Number,
        required: true,
        min: -50,
        max: 60
    },
    timestamp: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true,
        default: '°C'
    },
    processedAt: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    cityInfo: {
        country: String,
        timezone: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    date: {
        type: String,
        required: true
    },
    temperatureCategory: {
        type: String,
        enum: ['freezing', 'cold', 'cool', 'warm', 'hot']
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
temperatureSchema.index({ city: 1, timestamp: -1 });
temperatureSchema.index({ timestamp: -1 });
temperatureSchema.index({ temperatureCategory: 1 });

// Método estático para obtener estadísticas por ciudad
temperatureSchema.statics.getCityStats = async function(city, startDate, endDate) {
    const matchStage = { city };
    
    if (startDate && endDate) {
        matchStage.timestamp = {
            $gte: Math.floor(new Date(startDate).getTime() / 1000),
            $lte: Math.floor(new Date(endDate).getTime() / 1000)
        };
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$city',
                count: { $sum: 1 },
                avgTemp: { $avg: '$temperature' },
                minTemp: { $min: '$temperature' },
                maxTemp: { $max: '$temperature' },
                latestTemp: { $last: '$temperature' },
                latestTimestamp: { $last: '$timestamp' }
            }
        }
    ]);
};

// Método estático para obtener datos por rango de tiempo
temperatureSchema.statics.getDataByTimeRange = async function(startDate, endDate, city = null) {
    const query = {
        timestamp: {
            $gte: Math.floor(new Date(startDate).getTime() / 1000),
            $lte: Math.floor(new Date(endDate).getTime() / 1000)
        }
    };
    
    if (city) {
        query.city = city;
    }
    
    return await this.find(query).sort({ timestamp: -1 });
};

module.exports = mongoose.model('Temperature', temperatureSchema);