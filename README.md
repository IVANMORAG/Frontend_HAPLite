# 🌐 **Control inteligente de tu red MikroTik**

Una aplicación web moderna y responsive para monitorear y gestionar usuarios conectados a routers MikroTik en tiempo real. Controla el ancho de banda, bloquea usuarios y visualiza el tráfico de red con una interfaz intuitiva.

<a target="_blank" align="center">
  <img align="center" height="450" width="1000" alt="GIF" src="https://github.com/IVANMORAG/facial-point-detection/blob/main/recursos/Facial-Point-detector.gif">
</a>

## ✨ Características Principales

- 📊 **Monitoreo en tiempo real** - WebSocket para datos instantáneos
- 👥 **Gestión de usuarios** - Control completo de dispositivos conectados
- ⚡ **Control de ancho de banda** - Límites personalizables por usuario
- 🚫 **Bloqueo de usuarios** - Restricción temporal o permanente
- 📈 **Gráficas interactivas** - Visualización del tráfico de red
- 📱 **PWA** - Instalable como aplicación nativa
- 🎨 **UI Moderna** - Interfaz responsive con TailwindCSS
- 🔄 **Auto-actualización** - Datos sincronizados automáticamente


## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18.3.1** - Framework principal
- **Vite 4.5.14** - Build tool y dev server
- **TailwindCSS 3.4.17** - Framework CSS
- **Chart.js 4.5.0** - Gráficas interactivas
- **Socket.IO Client** - Comunicación en tiempo real
- **React Router DOM** - Navegación SPA
- **SweetAlert2** - Alertas elegantes
- **Axios** - Cliente HTTP

### Funcionalidades PWA
- **Vite PWA Plugin** - Service Worker automático
- **Workbox** - Estrategias de cache
- **Manifest** - Instalación nativa
- **Offline Support** - Funcionalidad sin conexión

## 📋 Prerrequisitos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Router MikroTik** con API habilitada
- **Backend RouterFlow** corriendo (puerto 5001 por defecto)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/routerflow.git
cd routerflow
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_FRONTEND_URL=http://localhost:5173
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Build para Producción

```bash
# Generar build optimizado
npm run build

# Preview del build
npm run preview
```

Los archivos optimizados se generan en la carpeta `dist/`

## 🏗️ Estructura del Proyecto

```
routerflow/
├── public/
│   ├── logo192.png          # PWA icons
│   ├── logo512.png
│   └── favicon.ico
├── src/
│   ├── components/          # Componentes React
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── LoginForm.jsx
│   │   ├── ConnectedUsers.jsx
│   │   ├── BandwidthChart.jsx
│   │   └── InstallPWAButton.jsx
│   ├── pages/              # Páginas principales
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── services/           # Servicios API
│   │   ├── api.js         # Cliente HTTP
│   │   ├── auth.js        # Autenticación
│   │   └── socket.js      # WebSocket
│   ├── hooks/             # Custom hooks
│   │   └── usePWA.js
│   ├── utils/             # Utilidades
│   │   └── pwaUtils.js
│   └── App.jsx            # Componente principal
├── .env                   # Variables de entorno
├── vite.config.js        # Configuración Vite
├── tailwind.config.js    # Configuración Tailwind
└── package.json
```

## 🔐 Configuración de Autenticación

### Credenciales por defecto
- **Usuario**: `admin`
- **Contraseña**: `password123`

> ⚠️ **Importante**: Cambia estas credenciales en producción

## 🌐 Configuración del Backend

Esta aplicación requiere el backend RouterFlow para funcionar. Asegúrate de que esté corriendo en el puerto configurado (5001 por defecto).

### Endpoints principales:
- `GET /api/mikrotik/users` - Usuarios conectados
- `GET /api/mikrotik/bandwidth` - Datos de ancho de banda
- `POST /api/mikrotik/speed-limit` - Establecer límites
- `POST /api/mikrotik/kick-user` - Bloquear usuario
- `WebSocket /socket.io` - Datos en tiempo real

## 📱 PWA (Progressive Web App)

### Características PWA incluidas:
- ✅ **Instalable** - Botón de instalación automático
- ✅ **Offline Ready** - Funcionalidad básica sin conexión
- ✅ **Cache Strategy** - Assets y API cacheados inteligentemente
- ✅ **Auto-Update** - Actualizaciones automáticas del Service Worker
- ✅ **Responsive** - Adaptable a cualquier dispositivo

### Instalar como aplicación:
1. Abre la app en el navegador
2. Busca el botón "Instalar App" en la barra superior
3. Sigue las instrucciones del navegador
4. ¡Listo! Ya tienes RouterFlow como app nativa

## 🎨 Personalización de UI

### Colores del tema (Tailwind)
El proyecto usa TailwindCSS con la paleta de colores por defecto. Para personalizar:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### Iconos personalizados
- Puedes reemplazar `logo192.png` y `logo512.png` en la carpeta `public/`
- Actualiza el `favicon.ico` según tu marca

## 🔧 Configuración Avanzada

### Proxy de desarrollo
El proyecto incluye configuración de proxy para desarrollo:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5001',
    '/socket.io': {
      target: 'ws://localhost:5001',
      ws: true
    }
  }
}
```

### Cache de PWA
Configuración de Workbox para estrategias de cache:

```javascript
// vite.config.js - PWA Config
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^http:\/\/localhost:5001\/api/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    }
  ]
}
```

## 🐛 Solución de Problemas

### Problemas comunes:

#### Error de conexión con el backend
```bash
Error: Network Error
```
**Solución**: Verifica que el backend esté corriendo en el puerto 5001

#### WebSocket no conecta
```bash
WebSocket connection failed
```
**Solución**: Revisa la configuración de CORS en el backend

#### PWA no se instala
**Solución**: Asegúrate de usar HTTPS en producción

#### Gráficas no cargan
**Solución**: Verifica que Chart.js esté correctamente importado

### Logs de desarrollo
Para ver logs detallados en desarrollo:

```bash
# Abrir DevTools (F12) y revisar Console
# Los logs incluyen prefijos útiles:
# [WebSocket] - Eventos de conexión
# [API] - Llamadas HTTP  
# [PWA] - Eventos PWA
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Estilo de código
- Usa **Prettier** para formateo
- Sigue las convenciones de **React Hooks**
- Comenta funciones complejas
- Usa **TypeScript** si es posible (migración futura)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.


