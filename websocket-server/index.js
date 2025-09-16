const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

class WebSocketServer {
    constructor() {
        this.port = process.env.PORT || 3002;
        this.webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3003/webhook';
        this.wss = null;
        this.clients = new Set();
        
        this.startServer();
    }

    startServer() {
        this.wss = new WebSocket.Server({ 
            port: this.port,
            host: 'localhost'
        });

        console.log(`🌐 WebSocket Server iniciado en puerto ${this.port}`);

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Nueva conexión WebSocket establecida');
            this.clients.add(ws);

            ws.on('message', async (data) => {
                try {
                    const temperatureData = JSON.parse(data);
                    console.log('📨 Datos recibidos:', temperatureData);
                    
                    // Validar datos
                    if (this.validateData(temperatureData)) {
                        // Enviar a webhook service
                        await this.sendToWebhook(temperatureData);
                        
                        // Responder al cliente
                        ws.send(JSON.stringify({
                            status: 'success',
                            message: 'Datos procesados correctamente',
                            timestamp: new Date().toISOString()
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            status: 'error',
                            message: 'Datos inválidos'
                        }));
                    }
                } catch (error) {
                    console.error('❌ Error procesando mensaje:', error.message);
                    ws.send(JSON.stringify({
                        status: 'error',
                        message: 'Error procesando datos'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 Conexión WebSocket cerrada');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ Error en WebSocket:', error.message);
                this.clients.delete(ws);
            });

            // Enviar mensaje de bienvenida
            ws.send(JSON.stringify({
                status: 'connected',
                message: 'Conectado al WebSocket Server',
                timestamp: new Date().toISOString()
            }));
        });

        this.wss.on('error', (error) => {
            console.error('❌ Error en WebSocket Server:', error.message);
        });
    }

    validateData(data) {
        const requiredFields = ['city', 'temperature', 'timestamp', 'unit'];
        
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`❌ Campo requerido faltante: ${field}`);
                return false;
            }
        }

        // Validar tipos
        if (typeof data.temperature !== 'number') {
            console.error('❌ Temperatura debe ser un número');
            return false;
        }

        if (typeof data.timestamp !== 'number') {
            console.error('❌ Timestamp debe ser un número');
            return false;
        }

        if (!['Shanghai', 'Berlin', 'Rio de Janeiro'].includes(data.city)) {
            console.error('❌ Ciudad no válida');
            return false;
        }

        if (data.unit !== '°C') {
            console.error('❌ Unidad debe ser °C');
            return false;
        }

        return true;
    }

    async sendToWebhook(data) {
        try {
            console.log(`📤 Enviando datos a webhook: ${this.webhookUrl}`);
            
            const response = await axios.post(this.webhookUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Source': 'websocket-server'
                },
                timeout: 5000
            });

            console.log('✅ Datos enviados exitosamente al webhook:', response.status);
            return response.data;
        } catch (error) {
            console.error('❌ Error enviando al webhook:', error.message);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
            
            throw error;
        }
    }

    // Método para obtener estadísticas
    getStats() {
        return {
            connectedClients: this.clients.size,
            port: this.port,
            webhookUrl: this.webhookUrl,
            uptime: process.uptime()
        };
    }

    // Método para broadcast a todos los clientes
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
}

// Inicializar el servidor
const server = new WebSocketServer();

// Endpoint para estadísticas (opcional)
const express = require('express');
const app = express();
app.use(express.json());

app.get('/stats', (req, res) => {
    res.json(server.getStats());
});

app.listen(3006, () => {
    console.log('📊 Servidor de estadísticas en puerto 3006');
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando WebSocket Server...');
    server.wss.close(() => {
        console.log('✅ WebSocket Server cerrado');
        process.exit(0);
    });
});

module.exports = WebSocketServer;