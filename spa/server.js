const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la API
const API_BASE_URL = process.env.API_URL || 'http://localhost:3004/api';

// Endpoint para obtener configuración del frontend
app.get('/api/config', (req, res) => {
    res.json({
        apiUrl: API_BASE_URL,
        cities: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
        refreshInterval: 5000 // 5 segundos
    });
});

// Proxy para evitar CORS (opcional)
app.use('/api/*', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios({
            method: req.method,
            url: `${API_BASE_URL}${req.path.replace('/api', '')}`,
            data: req.body,
            headers: {
                ...req.headers,
                host: undefined
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Error en proxy',
            error: error.message
        });
    }
});

// Servir la aplicación
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌐 SPA iniciada en puerto ${port}`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log(`📊 API URL: ${API_BASE_URL}`);
});

module.exports = app;