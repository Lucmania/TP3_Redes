const axios = require('axios');

// Script simple para crear datos de prueba
async function createTestData() {
    try {
        console.log('🚀 Creando datos de prueba...');
        
        const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
        const baseUrl = 'http://localhost:3004/api/temperature';
        
        // Crear datos para las últimas 2 horas (cada 5 minutos)
        const now = Date.now();
        const twoHoursAgo = now - (2 * 60 * 60 * 1000);
        
        for (let time = twoHoursAgo; time < now; time += 5 * 60 * 1000) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const temperature = generateTemperature(city);
            const timestamp = Math.floor(time / 1000);
            
            const data = {
                id: `test_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                city: city,
                temperature: temperature,
                timestamp: timestamp,
                unit: '°C',
                processedAt: new Date().toISOString(),
                source: 'test-script',
                cityInfo: getCityInfo(city),
                date: new Date(timestamp * 1000).toISOString(),
                temperatureCategory: categorizeTemperature(temperature)
            };
            
            try {
                await axios.post(baseUrl, data);
                console.log(`✅ Datos creados: ${city} - ${temperature}°C - ${new Date(timestamp * 1000).toLocaleString()}`);
            } catch (error) {
                console.log(`⚠️  Error creando datos: ${error.message}`);
            }
            
            // Pequeña pausa para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('🎉 Datos de prueba creados exitosamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function generateTemperature(city) {
    let baseTemp, variation;
    
    switch(city) {
        case 'Shanghai':
            baseTemp = 20;
            variation = 15;
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
    
    return parseFloat((baseTemp + (Math.random() - 0.5) * variation).toFixed(1));
}

function getCityInfo(city) {
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

function categorizeTemperature(temp) {
    if (temp < 0) return 'freezing';
    if (temp < 10) return 'cold';
    if (temp < 20) return 'cool';
    if (temp < 30) return 'warm';
    return 'hot';
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTestData();
}

module.exports = createTestData;