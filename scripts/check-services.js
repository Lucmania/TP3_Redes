const http = require('http');

// Script para verificar que todos los servicios estén funcionando
async function checkServices() {
    const services = [
        { name: 'REST API', port: 3004, path: '/health' },
        { name: 'Webhook Service', port: 3003, path: '/health' },
        { name: 'SPA', port: 3005, path: '/api/config' }
    ];

    console.log('🔍 Verificando servicios...\n');

    for (const service of services) {
        try {
            const result = await checkService(service);
            console.log(`${result.status} ${service.name} (Puerto ${service.port})`);
            if (result.data) {
                console.log(`   Respuesta: ${JSON.stringify(result.data).substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`❌ ${service.name} (Puerto ${service.port}) - Error: ${error.message}`);
        }
        console.log('');
    }
}

function checkService(service) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: service.port,
            path: service.path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode === 200 ? '✅' : '⚠️',
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode === 200 ? '✅' : '⚠️',
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Ejecutar verificación
checkServices().catch(console.error);
