const { spawn } = require('child_process');
const path = require('path');

// Script para iniciar la demo completa del sistema
class DemoStarter {
    constructor() {
        this.processes = [];
        this.services = [
            { name: 'WebSocket Client', path: 'websocket-client', port: 3001 },
            { name: 'WebSocket Server', path: 'websocket-server', port: 3002 },
            { name: 'Webhook Service', path: 'webhook-service', port: 3003 },
            { name: 'REST API', path: 'rest-api', port: 3004 },
            { name: 'SPA', path: 'spa', port: 3005 }
        ];
    }

    async start() {
        console.log('🚀 Iniciando Demo del Sistema de Microservicios TP3');
        console.log('=' .repeat(60));
        
        // Verificar que MongoDB esté disponible
        await this.checkMongoDB();
        
        // Configurar base de datos
        await this.setupDatabase();
        
        // Iniciar servicios
        await this.startServices();
        
        // Mostrar información de acceso
        this.showAccessInfo();
        
        // Manejar cierre graceful
        this.setupGracefulShutdown();
    }

    async checkMongoDB() {
        console.log('🔍 Verificando MongoDB...');
        
        try {
            const mongoose = require('mongoose');
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tp3-temperatura';
            
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000
            });
            
            console.log('✅ MongoDB disponible');
            await mongoose.connection.close();
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            console.log('💡 Asegúrate de que MongoDB esté ejecutándose');
            console.log('   - Local: mongod');
            console.log('   - Cloud: Verificar connection string');
            process.exit(1);
        }
    }

    async setupDatabase() {
        console.log('⚙️  Configurando base de datos...');
        
        try {
            const setupMongoDB = require('./setup-mongodb');
            await setupMongoDB();
            console.log('✅ Base de datos configurada');
        } catch (error) {
            console.error('❌ Error configurando base de datos:', error.message);
        }
    }

    async startServices() {
        console.log('🔄 Iniciando microservicios...');
        
        for (const service of this.services) {
            await this.startService(service);
            // Pequeña pausa entre servicios
            await this.sleep(2000);
        }
        
        console.log('✅ Todos los servicios iniciados');
    }

    async startService(service) {
        return new Promise((resolve, reject) => {
            console.log(`🚀 Iniciando ${service.name}...`);
            
            const process = spawn('npm', ['start'], {
                cwd: path.join(__dirname, '..', service.path),
                stdio: 'pipe',
                shell: true
            });
            
            this.processes.push({
                name: service.name,
                process: process,
                port: service.port
            });
            
            // Capturar output
            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output.includes('iniciado') || output.includes('started') || output.includes('listening')) {
                    console.log(`✅ ${service.name} iniciado en puerto ${service.port}`);
                    resolve();
                }
            });
            
            process.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error.includes('EADDRINUSE')) {
                    console.log(`⚠️  Puerto ${service.port} en uso, ${service.name} puede estar ya ejecutándose`);
                    resolve();
                } else if (error.includes('Error') || error.includes('error')) {
                    console.error(`❌ Error en ${service.name}:`, error);
                }
            });
            
            process.on('error', (error) => {
                console.error(`❌ Error iniciando ${service.name}:`, error.message);
                reject(error);
            });
            
            // Timeout para evitar espera infinita
            setTimeout(() => {
                console.log(`⏰ Timeout iniciando ${service.name}, continuando...`);
                resolve();
            }, 10000);
        });
    }

    showAccessInfo() {
        console.log('\n' + '=' .repeat(60));
        console.log('🎉 DEMO INICIADA EXITOSAMENTE');
        console.log('=' .repeat(60));
        console.log('\n📱 ACCESO A LA APLICACIÓN:');
        console.log('   🌐 SPA Principal: http://localhost:3005');
        console.log('   🔑 Usuario: admin@tp3.com');
        console.log('   🔐 Contraseña: admin123');
        
        console.log('\n🔧 SERVICIOS:');
        this.services.forEach(service => {
            console.log(`   ${service.name}: Puerto ${service.port}`);
        });
        
        console.log('\n📊 ENDPOINTS ÚTILES:');
        console.log('   🔍 API Health: http://localhost:3004/health');
        console.log('   📈 Webhook Health: http://localhost:3003/health');
        console.log('   📊 WebSocket Stats: http://localhost:3006/stats');
        
        console.log('\n💡 FUNCIONALIDADES:');
        console.log('   ✅ Generación automática de datos cada 5 segundos');
        console.log('   ✅ Gráficos en tiempo real');
        console.log('   ✅ Filtros por ciudad y tiempo');
        console.log('   ✅ Exportación de datos');
        console.log('   ✅ Dashboard interactivo');
        
        console.log('\n🛑 Para detener la demo: Ctrl+C');
        console.log('=' .repeat(60));
    }

    setupGracefulShutdown() {
        process.on('SIGINT', () => {
            console.log('\n🛑 Deteniendo demo...');
            this.stopAllServices();
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Deteniendo demo...');
            this.stopAllServices();
        });
    }

    stopAllServices() {
        console.log('🔄 Deteniendo servicios...');
        
        this.processes.forEach(({ name, process }) => {
            try {
                process.kill('SIGTERM');
                console.log(`✅ ${name} detenido`);
            } catch (error) {
                console.log(`⚠️  Error deteniendo ${name}:`, error.message);
            }
        });
        
        setTimeout(() => {
            console.log('👋 Demo finalizada');
            process.exit(0);
        }, 2000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const demo = new DemoStarter();
    demo.start().catch(error => {
        console.error('❌ Error iniciando demo:', error.message);
        process.exit(1);
    });
}

module.exports = DemoStarter;