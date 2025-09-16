const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

class WebhookService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.apiUrl = process.env.API_URL || 'http://localhost:3004/api/temperature';
        this.processedCount = 0;
        this.errorCount = 0;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Middleware de logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Endpoint principal del webhook
        this.app.post('/webhook', async (req, res) => {
            try {
                console.log('📨 Webhook recibido:', req.body);
                
                // Validar datos
                if (!this.validateWebhookData(req.body)) {
                    this.errorCount++;
                    return res.status(400).json({
                        success: false,
                        message: 'Datos inválidos en el webhook'
                    });
                }

                // Procesar y enriquecer datos
                const processedData = this.processData(req.body);
                
                // Enviar a REST API
                const result = await this.sendToAPI(processedData);
                
                this.processedCount++;
                
                res.json({
                    success: true,
                    message: 'Datos procesados exitosamente',
                    data: processedData,
                    apiResponse: result
                });

            } catch (error) {
                console.error('❌ Error en webhook:', error.message);
                this.errorCount++;
                
                res.status(500).json({
                    success: false,
                    message: 'Error procesando webhook',
                    error: error.message
                });
            }
        });

        // Endpoint de salud
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                processedCount: this.processedCount,
                errorCount: this.errorCount,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        // Endpoint de estadísticas
        this.app.get('/stats', (req, res) => {
            res.json({
                processedCount: this.processedCount,
                errorCount: this.errorCount,
                successRate: this.processedCount / (this.processedCount + this.errorCount) * 100,
                uptime: process.uptime(),
                apiUrl: this.apiUrl
            });
        });

        // Endpoint para testing
        this.app.get('/test', (req, res) => {
            res.json({
                message: 'Webhook Service funcionando correctamente',
                timestamp: new Date().toISOString()
            });
        });
    }

    validateWebhookData(data) {
        const requiredFields = ['city', 'temperature', 'timestamp', 'unit'];
        
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`❌ Campo requerido faltante: ${field}`);
                return false;
            }
        }

        // Validaciones adicionales
        if (typeof data.temperature !== 'number' || data.temperature < -50 || data.temperature > 60) {
            console.error('❌ Temperatura fuera de rango válido');
            return false;
        }

        if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
            console.error('❌ Timestamp inválido');
            return false;
        }

        return true;
    }

    processData(data) {
        // Enriquecer datos con información adicional
        const processedData = {
            ...data,
            id: this.generateId(),
            processedAt: new Date().toISOString(),
            source: 'webhook-service',
            // Agregar información de la ciudad
            cityInfo: this.getCityInfo(data.city),
            // Convertir timestamp a fecha legible
            date: new Date(data.timestamp * 1000).toISOString(),
            // Agregar clasificación de temperatura
            temperatureCategory: this.categorizeTemperature(data.temperature)
        };

        console.log('🔄 Datos procesados:', processedData);
        return processedData;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getCityInfo(city) {
        const cityData = {
            'Shanghai': {
                country: 'China',
                timezone: 'Asia/Shanghai',
                coordinates: { lat: 31.2304, lng: 121.4737 }
            },
            'Berlin': {
                country: 'Germany',
                timezone: 'Europe/Berlin',
                coordinates: { lat: 52.5200, lng: 13.4050 }
            },
            'Rio de Janeiro': {
                country: 'Brazil',
                timezone: 'America/Sao_Paulo',
                coordinates: { lat: -22.9068, lng: -43.1729 }
            }
        };
        
        return cityData[city] || null;
    }

    categorizeTemperature(temp) {
        if (temp < 0) return 'freezing';
        if (temp < 10) return 'cold';
        if (temp < 20) return 'cool';
        if (temp < 30) return 'warm';
        return 'hot';
    }

    async sendToAPI(data) {
        try {
            console.log(`📤 Enviando datos a API: ${this.apiUrl}`);
            
            const response = await axios.post(this.apiUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Source': 'webhook-service'
                },
                timeout: 10000
            });

            console.log('✅ Datos enviados exitosamente a API:', response.status);
            return response.data;
        } catch (error) {
            console.error('❌ Error enviando a API:', error.message);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
            
            throw error;
        }
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Webhook Service iniciado en puerto ${this.port}`);
            console.log(`📡 API URL: ${this.apiUrl}`);
            console.log(`🔗 Webhook endpoint: http://localhost:${this.port}/webhook`);
        });
    }
}

// Inicializar el servicio
const webhookService = new WebhookService();

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando Webhook Service...');
    process.exit(0);
});

module.exports = WebhookService;