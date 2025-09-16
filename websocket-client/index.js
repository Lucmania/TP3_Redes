const WebSocket = require('ws');
require('dotenv').config();

class TemperatureGenerator {
    constructor() {
        this.cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
        this.wsServerUrl = process.env.WS_SERVER_URL || 'ws://localhost:3002';
        this.ws = null;
        this.isConnected = false;
        this.intervalId = null;
        
        this.connect();
    }

    connect() {
        console.log('🌡️  Conectando al WebSocket Server...');
        
        // Pequeño delay para esperar que el servidor esté listo
        setTimeout(() => {
            this.ws = new WebSocket(this.wsServerUrl);
            
            this.ws.on('open', () => {
                console.log('✅ Conectado al WebSocket Server');
                this.isConnected = true;
                this.startGenerating();
            });
            
            this.ws.on('close', () => {
                console.log('❌ Conexión cerrada. Reintentando en 5 segundos...');
                this.isConnected = false;
                this.stopGenerating();
                setTimeout(() => this.connect(), 5000);
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ Error en WebSocket:', error.message);
                this.isConnected = false;
            });
        }, 2000);
    }

    generateTemperature(city) {
        // Generar temperaturas realistas según la ciudad
        let baseTemp, variation;
        
        switch(city) {
            case 'Shanghai':
                baseTemp = 20; // Temperatura promedio
                variation = 15; // Variación
                break;
            case 'Berlin':
                baseTemp = 10;
                variation = 20;
                break;
            case 'Rio de Janeiro':
                baseTemp = 25;
                variation = 10;
                break;
            default:
                baseTemp = 15;
                variation = 15;
        }
        
        // Generar temperatura con variación realista
        const temp = (baseTemp + (Math.random() - 0.5) * variation).toFixed(1);
        return parseFloat(temp);
    }

    startGenerating() {
        console.log('🚀 Iniciando generación de temperaturas...');
        
        // Generar 1 medición cada 10 segundos para evitar sobrecarga
        this.intervalId = setInterval(() => {
            if (this.isConnected) {
                const city = this.cities[Math.floor(Math.random() * this.cities.length)];
                const temperature = this.generateTemperature(city);
                const timestamp = Math.floor(Date.now() / 1000); // UTC timestamp
                
                const data = {
                    city: city,
                    temperature: temperature,
                    timestamp: timestamp,
                    unit: '°C'
                };
                
                console.log(`📊 Enviando: ${city} - ${temperature}°C - ${new Date(timestamp * 1000).toISOString()}`);
                
                this.ws.send(JSON.stringify(data));
            }
        }, 10000); // 10 segundos
    }

    stopGenerating() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️  Generación de temperaturas detenida');
        }
    }

    // Método para simular datos de una semana (para testing)
    generateWeekData() {
        console.log('📅 Generando datos de una semana...');
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        for (let time = weekAgo; time < now; time += 30 * 60 * 1000) { // Cada 30 minutos
            const city = this.cities[Math.floor(Math.random() * this.cities.length)];
            const temperature = this.generateTemperature(city);
            const timestamp = Math.floor(time / 1000);
            
            const data = {
                city: city,
                temperature: temperature,
                timestamp: timestamp,
                unit: '°C'
            };
            
            // Enviar datos históricos
            if (this.isConnected) {
                this.ws.send(JSON.stringify(data));
            }
        }
    }
}

// Inicializar el generador
const generator = new TemperatureGenerator();

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando generador de temperaturas...');
    generator.stopGenerating();
    if (generator.ws) {
        generator.ws.close();
    }
    process.exit(0);
});

module.exports = TemperatureGenerator;