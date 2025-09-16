const mongoose = require('mongoose');

// Script para configurar MongoDB y crear datos de prueba
async function setupMongoDB() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tp3-temperatura';
        
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000
        });
        
        console.log('✅ Conectado a MongoDB');
        
        // Importar modelos
        const User = require('../rest-api/models/User');
        const Temperature = require('../rest-api/models/Temperature');
        
        // Crear usuario admin si no existe
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
        } else {
            console.log('👤 Usuario admin ya existe');
        }
        
        // Crear datos de prueba si no existen
        const existingData = await Temperature.countDocuments();
        if (existingData === 0) {
            console.log('📊 Creando datos de prueba...');
            await createSampleData(Temperature);
            console.log('✅ Datos de prueba creados');
        } else {
            console.log(`📊 Ya existen ${existingData} registros en la base de datos`);
        }
        
        // Mostrar estadísticas
        const stats = await getDatabaseStats(Temperature);
        console.log('📈 Estadísticas de la base de datos:');
        console.log(`   - Total registros: ${stats.total}`);
        console.log(`   - Por ciudad:`, stats.byCity);
        console.log(`   - Rango de fechas: ${stats.dateRange.start} - ${stats.dateRange.end}`);
        
        console.log('🎉 Configuración completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en configuración:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
    }
}

async function createSampleData(Temperature) {
    const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const temperatures = [];
    
    // Generar datos para la última semana (cada 30 minutos)
    for (let time = weekAgo; time < now; time += 30 * 60 * 1000) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const temperature = generateRealisticTemperature(city);
        const timestamp = Math.floor(time / 1000);
        
        const tempData = {
            id: `sample_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            city: city,
            temperature: temperature,
            timestamp: timestamp,
            unit: '°C',
            processedAt: new Date().toISOString(),
            source: 'setup-script',
            cityInfo: getCityInfo(city),
            date: new Date(timestamp * 1000).toISOString(),
            temperatureCategory: categorizeTemperature(temperature)
        };
        
        temperatures.push(tempData);
    }
    
    // Insertar en lotes de 100
    for (let i = 0; i < temperatures.length; i += 100) {
        const batch = temperatures.slice(i, i + 100);
        await Temperature.insertMany(batch);
    }
}

function generateRealisticTemperature(city) {
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

async function getDatabaseStats(Temperature) {
    const total = await Temperature.countDocuments();
    
    const byCity = await Temperature.aggregate([
        {
            $group: {
                _id: '$city',
                count: { $sum: 1 },
                avgTemp: { $avg: '$temperature' }
            }
        }
    ]);
    
    const dateRange = await Temperature.aggregate([
        {
            $group: {
                _id: null,
                minDate: { $min: '$timestamp' },
                maxDate: { $max: '$timestamp' }
            }
        }
    ]);
    
    return {
        total,
        byCity: byCity.reduce((acc, item) => {
            acc[item._id] = { count: item.count, avgTemp: item.avgTemp.toFixed(1) };
            return acc;
        }, {}),
        dateRange: {
            start: dateRange[0] ? new Date(dateRange[0].minDate * 1000).toISOString() : 'N/A',
            end: dateRange[0] ? new Date(dateRange[0].maxDate * 1000).toISOString() : 'N/A'
        }
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupMongoDB();
}

module.exports = setupMongoDB;