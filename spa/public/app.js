class TemperatureApp {
    constructor() {
        this.apiUrl = 'http://localhost:3004/api';
        this.token = localStorage.getItem('token');
        this.charts = {};
        this.data = [];
        this.refreshInterval = null;
        this.wsConnection = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Controls
        document.getElementById('city-filter').addEventListener('change', () => {
            this.forceRefresh();
        });

        document.getElementById('time-range').addEventListener('change', () => {
            this.forceRefresh();
        });

        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.forceRefresh();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('token', this.token);
                this.showNotification('Login exitoso', 'success');
                
                // Pequeño delay para que se vea la notificación
                setTimeout(() => {
                    this.showDashboard();
                }, 500);
            } else {
                this.showNotification(data.message || 'Credenciales incorrectas', 'error');
            }
        } catch (error) {
            this.showNotification('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showDashboard();
                await this.loadData();
            } else {
                this.logout();
            }
        } catch (error) {
            this.logout();
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        this.showLogin();
        this.stopRefresh();
        if (this.wsConnection) {
            this.wsConnection.close();
        }
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.initializeCharts();
        this.checkServicesStatus(); // Verificar estado de servicios
        
        // Cargar datos inmediatamente al mostrar el dashboard
        this.loadData();
        this.startRefresh();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    async checkServicesStatus() {
        try {
            // Verificar API con timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const apiResponse = await fetch(`http://localhost:3004/health`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                this.updateStatus('api', true);
                console.log('✅ API Status:', data);
            } else {
                this.updateStatus('api', false);
                console.log('❌ API Status: Error', apiResponse.status);
            }
            
            // Verificar WebSocket (simulado)
            this.updateStatus('ws', true);
            
        } catch (error) {
            console.log('❌ Error checking services:', error.message);
            this.updateStatus('api', false);
            this.updateStatus('ws', false);
        }
    }

    async loadData() {
        try {
            const timeRange = document.getElementById('time-range').value;
            const city = document.getElementById('city-filter').value;
            
            // Si solo cambió el filtro de ciudad, usar datos existentes para actualización inmediata
            if (city && this.data.length > 0) {
                this.updateChartsWithExistingData();
            }
            
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '1h':
                    startDate.setHours(endDate.getHours() - 1);
                    break;
                case '6h':
                    startDate.setHours(endDate.getHours() - 6);
                    break;
                case '24h':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
            }

            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            if (city) {
                params.append('city', city);
            }

            // Solo mostrar loading si no hay datos previos
            if (this.data.length === 0) {
                this.showLoadingIndicator();
            }

            const response = await fetch(`${this.apiUrl}/temperature/range?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.data = data.data;
                
                // Actualizar UI inmediatamente
                this.updateStats();
                this.updateCharts();
                this.updateTable();
                this.updateStatus('data', true);
                this.hideLoadingIndicator();
                
                if (this.data.length === 0) {
                    this.showNotification('No hay datos disponibles. Los datos se generarán automáticamente.', 'info');
                }
            } else {
                this.showNotification('Error cargando datos: ' + (data.message || 'Error desconocido'), 'error');
                this.updateStatus('data', false);
                this.hideLoadingIndicator();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error de conexión', 'error');
            this.updateStatus('data', false);
            this.hideLoadingIndicator();
        }
    }

    updateChartsWithExistingData() {
        // Actualización inmediata con datos existentes mientras se cargan los nuevos
        this.updateStats();
        this.updateCharts();
        this.updateTable();
    }

    async forceRefresh() {
        // Función que fuerza la actualización completa como el botón "Actualizar"
        try {
            const timeRange = document.getElementById('time-range').value;
            const city = document.getElementById('city-filter').value;
            
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '1h':
                    startDate.setHours(endDate.getHours() - 1);
                    break;
                case '6h':
                    startDate.setHours(endDate.getHours() - 6);
                    break;
                case '24h':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
            }

            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            if (city) {
                params.append('city', city);
            }

            // Mostrar loading indicator
            this.showLoadingIndicator();

            const response = await fetch(`${this.apiUrl}/temperature/range?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.data = data.data;
                
                // Actualizar TODO inmediatamente
                this.updateStats();
                this.updateCharts();
                this.updateTable();
                this.updateStatus('data', true);
                this.hideLoadingIndicator();
                
                if (this.data.length === 0) {
                    this.showNotification('No hay datos disponibles. Los datos se generarán automáticamente.', 'info');
                }
            } else {
                this.showNotification('Error cargando datos: ' + (data.message || 'Error desconocido'), 'error');
                this.updateStatus('data', false);
                this.hideLoadingIndicator();
            }
        } catch (error) {
            console.error('Error in force refresh:', error);
            this.showNotification('Error de conexión', 'error');
            this.updateStatus('data', false);
            this.hideLoadingIndicator();
        }
    }

    updateStats() {
        const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
        
        cities.forEach(city => {
            const cityData = this.data.filter(d => d.city === city);
            if (cityData.length > 0) {
                const latest = cityData[0]; // Los datos están ordenados por timestamp descendente
                
                // Mapear nombres de ciudades a IDs correctos
                let cityId = city.toLowerCase();
                if (cityId === 'rio de janeiro') {
                    cityId = 'rio';
                }
                
                const tempElement = document.getElementById(`${cityId}-temp`);
                const timeElement = document.getElementById(`${cityId}-time`);
                
                if (tempElement && timeElement) {
                    tempElement.textContent = `${latest.temperature}°C`;
                    timeElement.textContent = new Date(latest.timestamp * 1000).toLocaleTimeString();
                    
                    // Sistema de alertas por temperatura extrema
                    this.checkTemperatureAlerts(city, latest.temperature);
                }
            }
        });
    }

    checkTemperatureAlerts(city, temperature) {
        // Definir rangos de alerta por ciudad
        const alerts = {
            'Shanghai': { min: 5, max: 35 },
            'Berlin': { min: -10, max: 30 },
            'Rio de Janeiro': { min: 15, max: 40 }
        };
        
        const cityAlerts = alerts[city];
        if (cityAlerts) {
            if (temperature < cityAlerts.min) {
                this.showNotification(`🚨 ALERTA: ${city} - Temperatura muy baja: ${temperature}°C`, 'error');
            } else if (temperature > cityAlerts.max) {
                this.showNotification(`🔥 ALERTA: ${city} - Temperatura muy alta: ${temperature}°C`, 'error');
            }
        }
    }

    initializeCharts() {
        // Temperature Chart - Cambiado a gráfico de barras horizontales
        const tempCtx = document.getElementById('temperature-chart').getContext('2d');
        this.charts.temperature = new Chart(tempCtx, {
            type: 'bar',
            data: {
                labels: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
                datasets: [{
                    label: 'Temperatura Actual (°C)',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Barras horizontales
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        },
                        min: 0,
                        max: 40,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Ciudades'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Temperatura Actual por Ciudad'
                    }
                }
            }
        });

        // Comparison Chart
        const compCtx = document.getElementById('comparison-chart').getContext('2d');
        this.charts.comparison = new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: ['Shanghai', 'Berlin', 'Rio de Janeiro'],
                datasets: [{
                    label: 'Temperatura Promedio',
                    data: [0, 0, 0],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    }
                }
            }
        });

        // Distribution Chart
        const distCtx = document.getElementById('distribution-chart').getContext('2d');
        this.charts.distribution = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Frío', 'Fresco', 'Templado', 'Cálido', 'Caliente'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e67e22', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Trend Chart
        const trendCtx = document.getElementById('trend-chart').getContext('2d');
        this.charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (!this.data.length) return;

        const city = document.getElementById('city-filter').value;
        const filteredData = city ? this.data.filter(d => d.city === city) : this.data;

        // Actualizar gráficos de forma síncrona para mejor rendimiento
        this.updateTemperatureChart(filteredData);
        this.updateComparisonChart();
        this.updateDistributionChart(filteredData);
        this.updateTrendChart(filteredData);
    }

    updateTemperatureChart(data) {
        const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
        
        // Obtener la temperatura más reciente de cada ciudad
        const temperatures = cities.map(city => {
            const cityData = data.filter(d => d.city === city);
            return cityData.length > 0 ? cityData[0].temperature : 0;
        });

        // Actualizar los datos del gráfico
        this.charts.temperature.data.datasets[0].data = temperatures;
        
        // Configurar escala dinámica
        if (data.length > 0) {
            const temps = data.map(d => d.temperature);
            const maxTemp = Math.max(...temps);
            
            // Establecer el máximo con un margen del 20%
            this.charts.temperature.options.scales.x.max = Math.ceil(maxTemp * 1.2);
        }
        
        this.charts.temperature.update('none');
    }

    updateComparisonChart() {
        const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
        const averages = cities.map(city => {
            const cityData = this.data.filter(d => d.city === city);
            if (cityData.length === 0) return 0;
            const sum = cityData.reduce((acc, d) => acc + d.temperature, 0);
            return Math.round((sum / cityData.length) * 10) / 10; // Redondear a 1 decimal
        });

        // Actualizar datos del gráfico
        this.charts.comparison.data.datasets[0].data = averages;
        
        // Configurar escala dinámica
        const maxTemp = Math.max(...averages);
        if (maxTemp > 0) {
            this.charts.comparison.options.scales.y.max = Math.ceil(maxTemp * 1.2);
        }
        
        this.charts.comparison.update('none'); // Actualización sin animación para ser más rápido
    }

    updateDistributionChart(data) {
        const categories = {
            'freezing': 0,
            'cold': 0,
            'cool': 0,
            'warm': 0,
            'hot': 0
        };

        data.forEach(d => {
            if (categories.hasOwnProperty(d.temperatureCategory)) {
                categories[d.temperatureCategory]++;
            }
        });

        this.charts.distribution.data.datasets[0].data = Object.values(categories);
        this.charts.distribution.update('none');
    }

    updateTrendChart(data) {
        // Agrupar por hora para mostrar tendencia
        const hourlyData = {};
        
        data.forEach(d => {
            const hour = new Date(d.timestamp * 1000).getHours();
            if (!hourlyData[hour]) {
                hourlyData[hour] = [];
            }
            hourlyData[hour].push(d.temperature);
        });

        const hours = Object.keys(hourlyData).sort((a, b) => a - b);
        const avgTemps = hours.map(hour => {
            const temps = hourlyData[hour];
            return temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        });

        this.charts.trend.data.labels = hours.map(h => `${h}:00`);
        this.charts.trend.data.datasets = [{
            label: 'Temperatura Promedio por Hora',
            data: avgTemps,
            borderColor: '#667eea',
            backgroundColor: '#667eea20',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
        }];
        
        // Configurar escalas para mejor visualización
        if (avgTemps.length > 0) {
            const minTemp = Math.min(...avgTemps);
            const maxTemp = Math.max(...avgTemps);
            const range = maxTemp - minTemp;
            
            // Añadir margen del 15% arriba y abajo
            this.charts.trend.options.scales.y.min = Math.max(0, minTemp - (range * 0.15));
            this.charts.trend.options.scales.y.max = maxTemp + (range * 0.15);
            
            // Asegurar que el mínimo no sea negativo
            if (this.charts.trend.options.scales.y.min < 0) {
                this.charts.trend.options.scales.y.min = 0;
            }
        }
        
        this.charts.trend.update('none');
    }


    updateTable() {
        const tbody = document.getElementById('data-table-body');
        tbody.innerHTML = '';

        const city = document.getElementById('city-filter').value;
        let filteredData = city ? this.data.filter(d => d.city === city) : this.data;
        
        // Si no hay filtro de ciudad, mostrar solo el último registro de cada ciudad
        if (!city) {
            const cities = ['Shanghai', 'Berlin', 'Rio de Janeiro'];
            const latestByCity = {};
            
            cities.forEach(cityName => {
                const cityData = this.data.filter(d => d.city === cityName);
                if (cityData.length > 0) {
                    latestByCity[cityName] = cityData[0]; // El más reciente
                }
            });
            
            filteredData = Object.values(latestByCity);
        }
        
        // Ordenar por timestamp descendente (más reciente primero)
        filteredData.sort((a, b) => b.timestamp - a.timestamp);
        
        filteredData.slice(0, 20).forEach(d => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${d.city}</td>
                <td>${d.temperature}°C</td>
                <td>${new Date(d.timestamp * 1000).toLocaleString()}</td>
                <td>${this.getCategoryLabel(d.temperatureCategory)}</td>
            `;
        });
        
        // Si no hay datos, mostrar mensaje
        if (filteredData.length === 0) {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td colspan="4" style="text-align: center; color: #666;">
                    No hay datos disponibles para ${city || 'las ciudades seleccionadas'}
                </td>
            `;
        }
    }

    getCategoryLabel(category) {
        const labels = {
            'freezing': '❄️ Congelante',
            'cold': '🥶 Frío',
            'cool': '😌 Fresco',
            'warm': '😊 Templado',
            'hot': '🔥 Caliente'
        };
        return labels[category] || category;
    }

    updateStatus(type, connected) {
        const statusDot = document.getElementById(`${type}-status`);
        if (statusDot) {
            if (connected) {
                statusDot.classList.add('connected');
                statusDot.style.background = '#27ae60'; // Verde
            } else {
                statusDot.classList.remove('connected');
                statusDot.style.background = '#e74c3c'; // Rojo
            }
        }
    }

    startRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 30000); // 30 segundos - menos agresivo
    }

    stopRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    exportData() {
        const city = document.getElementById('city-filter').value;
        const filteredData = city ? this.data.filter(d => d.city === city) : this.data;
        
        const csv = this.convertToCSV(filteredData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `temperatura_${city || 'todas'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        const headers = ['Ciudad', 'Temperatura_C', 'Timestamp_UTC', 'Fecha_ISO', 'Categoria', 'Pais', 'Timezone'];
        const rows = data.map(d => [
            d.city,
            d.temperature,
            d.timestamp,
            new Date(d.timestamp * 1000).toISOString(),
            d.temperatureCategory,
            d.country || 'N/A',
            d.timezone || 'UTC'
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    showLoadingIndicator() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => {
            chart.style.opacity = '0.7';
            chart.style.transition = 'opacity 0.3s ease';
        });
    }

    hideLoadingIndicator() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => {
            chart.style.opacity = '1';
            chart.style.transition = 'opacity 0.3s ease';
        });
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new TemperatureApp();
});