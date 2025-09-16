const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const temperatureRoutes = require('./routes/temperature');

class RestAPI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3004;
        this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tp3-temperatura';
        
        this.setupMiddleware();
        this.setupRoutes();
        this.connectDatabase();
        this.startServer();
    }

    setupMiddleware() {
        // Seguridad
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3005',
            credentials: true
        }));

        // Rate limiting - Configuración más permisiva para demo
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minuto
            max: 1000, // máximo 1000 requests por IP por minuto
            message: {
                success: false,
                message: 'Demasiadas solicitudes, intenta más tarde'
            }
        });
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Rutas principales
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/temperature', temperatureRoutes);

        // Endpoint de salud
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
            });
        });

        // Endpoint de información
        this.app.get('/', (req, res) => {
            res.json({
                message: 'TP3 - REST API para Sistema de Temperatura',
                version: '1.0.0',
                endpoints: {
                    auth: '/api/auth',
                    temperature: '/api/temperature',
                    health: '/health'
                },
                documentation: 'Ver README.md para más información'
            });
        });

        // Manejo de rutas no encontradas
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint no encontrado'
            });
        });

        // Manejo de errores
        this.app.use((error, req, res, next) => {
            console.error('Error en API:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        });
    }

    async connectDatabase() {
        try {
            await mongoose.connect(this.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            console.log('✅ Conectado a MongoDB');
            
            // Crear usuario admin por defecto si no existe
            await this.createDefaultAdmin();
            
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            process.exit(1);
        }
    }

    async createDefaultAdmin() {
        try {
            const User = require('./models/User');
            const existingAdmin = await User.findOne({ role: 'admin' });
            
            if (!existingAdmin) {
                const admin = new User({
                    username: 'admin',
                    email: 'admin@tp3.com',
                    password: 'admin123',
                    role: 'admin'
                });
                
                await admin.save();
                console.log('👤 Usuario admin creado: admin@tp3.com / admin123');
            }
        } catch (error) {
            console.error('Error creando admin por defecto:', error.message);
        }
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`🚀 REST API iniciada en puerto ${this.port}`);
            console.log(`📊 Base de datos: ${this.mongoUri}`);
            console.log(`🔗 Endpoints disponibles:`);
            console.log(`   - Auth: http://localhost:${this.port}/api/auth`);
            console.log(`   - Temperature: http://localhost:${this.port}/api/temperature`);
            console.log(`   - Health: http://localhost:${this.port}/health`);
        });
    }
}

// Inicializar la API
const api = new RestAPI();

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando REST API...');
    await mongoose.connection.close();
    console.log('✅ Conexión a base de datos cerrada');
    process.exit(0);
});

module.exports = RestAPI;