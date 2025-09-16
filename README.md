# 🌡️ TP3 - Sistema de Monitoreo de Temperatura en Tiempo Real

## 📋 **Descripción del Proyecto**

Sistema completo de microservicios para el monitoreo de temperaturas en tiempo real de tres ciudades: **Shanghai**, **Berlin** y **Rio de Janeiro**. Desarrollado para la empresa 天气在你手中 (El clima en tu mano) como migración de arquitectura monolítica a microservicios.

## 🏗️ **Arquitectura del Sistema**

### **Microservicios:**
- 🔌 **WebSocket Client** (Puerto 3002) - Generador de datos
- 📡 **WebSocket Server** (Puerto 3003) - Receptor de datos
- 🔗 **Webhook Service** (Puerto 3004) - Procesador de datos
- 🚀 **REST API** (Puerto 3005) - API y base de datos
- 💻 **SPA Dashboard** (Puerto 3006) - Interfaz de usuario

## 🚀 **Instalación y Ejecución**

### **Prerrequisitos:**
- Node.js 16+
- MongoDB (local o Atlas)
- Navegador web moderno

### **Instalación:**
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/tp3-temperatura.git
cd tp3-temperatura

# Instalar dependencias
npm run install-all

# Configurar base de datos
npm run setup-db

# Ejecutar sistema completo
npm start
```

### **Acceso:**
- **Dashboard**: http://localhost:3006
- **Usuario**: admin@tp3.com
- **Contraseña**: admin123

## 📊 **Funcionalidades**

### **✅ Requisitos Cumplidos:**
- ✅ **3 ciudades configuradas** (Shanghai, Berlin, Rio de Janeiro)
- ✅ **Temperatura en °C**
- ✅ **Timestamp UTC**
- ✅ **Datos cada 10 segundos** (testing)
- ✅ **Base de datos Cloud** (MongoDB Atlas)
- ✅ **SPA con gráficos** interactivos
- ✅ **Comunicación entre microservicios**

### **🚀 Funcionalidades Extra:**
- ✅ **Sistema de alertas** por temperatura extrema
- ✅ **Dashboard responsivo** y moderno
- ✅ **Múltiples tipos de gráficos** (líneas, barras, dona, tendencias)
- ✅ **Exportación CSV** para PowerBI
- ✅ **Filtros por ciudad y tiempo**
- ✅ **Indicadores de estado** en tiempo real
- ✅ **Sistema de notificaciones**

## 🛠️ **Tecnologías Utilizadas**

### **Backend:**
- **Node.js** - Runtime principal
- **Express.js** - Framework web
- **WebSocket** - Comunicación en tiempo real
- **JWT** - Autenticación segura
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

### **Frontend:**
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript ES6+** - Lógica del cliente
- **Chart.js** - Gráficos interactivos
- **Responsive Design** - Adaptable a dispositivos

### **Herramientas:**
- **PowerBI** - Análisis de datos
- **CSV Export** - Intercambio de datos
- **GitHub** - Control de versiones
- **Vercel** - Despliegue

## 📈 **Gráficos y Visualizaciones**

- **📊 Gráfico de Temperatura en Tiempo Real** - Líneas de tendencia por ciudad
- **📊 Comparación por Ciudad** - Gráfico de barras con promedios
- **📊 Distribución de Temperaturas** - Gráfico de dona con categorías
- **📊 Tendencia Temporal** - Promedio por hora con análisis de patrones

## 🔐 **Sistema de Autenticación**

- **JWT Tokens** para seguridad
- **Usuario por defecto:** admin@tp3.com
- **Contraseña:** admin123
- **Sesiones seguras** con expiración

## 📁 **Estructura del Proyecto**

```
TP3/
├── websocket-client/     # Generador de datos
├── websocket-server/     # Servidor WebSocket
├── webhook-service/      # Procesador de datos
├── rest-api/            # API REST + Base de datos
├── spa/                 # Dashboard frontend
├── scripts/             # Scripts de utilidad
└── package.json         # Configuración principal
```
tton)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/tp3-temperatura)

## 📊 **Integración con PowerBI**

1. **Exportar datos** desde el dashboard
2. **Importar CSV** en PowerBI Desktop
3. **Crear visualizaciones** personalizadas
4. **Análisis de tendencias** y patrones

## 🎯 **Demo**

- **Usuario**: admin@tp3.com
- **Contraseña**: admin123
