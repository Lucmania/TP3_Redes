const express = require('express');
const Temperature = require('../models/Temperature');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Endpoint para recibir datos del webhook (sin autenticación)
router.post('/', async (req, res) => {
    try {
        console.log('📨 Datos recibidos en API:', req.body);

        // Validar datos
        if (!req.body.city || !req.body.temperature || !req.body.timestamp) {
            return res.status(400).json({
                success: false,
                message: 'Datos requeridos faltantes'
            });
        }

        // Crear nuevo registro de temperatura
        const temperature = new Temperature(req.body);
        await temperature.save();

        console.log('✅ Temperatura guardada en base de datos:', temperature.id);

        res.status(201).json({
            success: true,
            message: 'Datos de temperatura guardados exitosamente',
            data: {
                id: temperature.id,
                city: temperature.city,
                temperature: temperature.temperature,
                timestamp: temperature.timestamp
            }
        });

    } catch (error) {
        console.error('❌ Error guardando temperatura:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener todas las temperaturas (con autenticación)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { city, limit = 100, page = 1 } = req.query;
        
        const query = {};
        if (city) {
            query.city = city;
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;

        const temperatures = await Temperature.find(query)
            .sort({ timestamp: -1 })
            .limit(limitNum)
            .skip(skip);

        const total = await Temperature.countDocuments(query);

        res.json({
            success: true,
            data: temperatures,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error obteniendo temperaturas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas por ciudad
router.get('/stats/:city', authenticateToken, async (req, res) => {
    try {
        const { city } = req.params;
        const { startDate, endDate } = req.query;

        if (!['Shanghai', 'Berlin', 'Rio de Janeiro'].includes(city)) {
            return res.status(400).json({
                success: false,
                message: 'Ciudad no válida'
            });
        }

        const stats = await Temperature.getCityStats(city, startDate, endDate);

        res.json({
            success: true,
            city,
            stats: stats[0] || {
                _id: city,
                count: 0,
                avgTemp: 0,
                minTemp: 0,
                maxTemp: 0,
                latestTemp: 0,
                latestTimestamp: 0
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener datos por rango de tiempo
router.get('/range', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, city } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate y endDate son requeridos'
            });
        }

        const data = await Temperature.getDataByTimeRange(startDate, endDate, city);

        res.json({
            success: true,
            data,
            count: data.length,
            range: {
                startDate,
                endDate,
                city: city || 'all'
            }
        });

    } catch (error) {
        console.error('Error obteniendo datos por rango:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener última temperatura por ciudad
router.get('/latest', authenticateToken, async (req, res) => {
    try {
        const { city } = req.query;

        const query = {};
        if (city) {
            query.city = city;
        }

        const latestTemps = await Temperature.find(query)
            .sort({ timestamp: -1 })
            .limit(3);

        res.json({
            success: true,
            data: latestTemps
        });

    } catch (error) {
        console.error('Error obteniendo últimas temperaturas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para análisis de datos (solo admin)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysNum = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        // Estadísticas generales
        const totalRecords = await Temperature.countDocuments();
        const recordsInRange = await Temperature.countDocuments({
            timestamp: { $gte: Math.floor(startDate.getTime() / 1000) }
        });

        // Estadísticas por ciudad
        const cityStats = await Promise.all([
            Temperature.getCityStats('Shanghai', startDate.toISOString()),
            Temperature.getCityStats('Berlin', startDate.toISOString()),
            Temperature.getCityStats('Rio de Janeiro', startDate.toISOString())
        ]);

        // Temperaturas por categoría
        const categoryStats = await Temperature.aggregate([
            {
                $match: {
                    timestamp: { $gte: Math.floor(startDate.getTime() / 1000) }
                }
            },
            {
                $group: {
                    _id: '$temperatureCategory',
                    count: { $sum: 1 },
                    avgTemp: { $avg: '$temperature' }
                }
            }
        ]);

        res.json({
            success: true,
            analytics: {
                period: `${daysNum} días`,
                totalRecords,
                recordsInRange,
                cityStats: cityStats.flat(),
                categoryStats
            }
        });

    } catch (error) {
        console.error('Error en analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar datos (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const temperature = await Temperature.findOneAndDelete({ id });
        
        if (!temperature) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Registro eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando registro:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;