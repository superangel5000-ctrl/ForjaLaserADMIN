# 🔨 Forja Laser - Panel de Administración

Este proyecto es una aplicación web completa y funcional de administración para **Forja Laser**, diseñada para uso interno (1-3 colaboradores) que facilita la gestión de productos de MDF personalizados, el cálculo automático de costos mediante fórmulas matemáticas basadas en el área y tiempos de corte, la organización de publicaciones para redes sociales, y un potente cotizador integrado con generación de PDF e hilos directos con WhatsApp.

La aplicación está construida sobre un entorno moderno con **React 19**, **Vite**, **TypeScript** y **Tailwind CSS**, utilizando como motor de persistencia duradera en tiempo real **Firebase Realtime Database**.

---

## 📋 Características Principales

1. **Dashboard de Analíticas:**
   - Visualización de KPIs clave: Total de Productos, Margen de Ganancia Promedio, Publicaciones Activas y Número de Cotizaciones Realizadas.
   - Calendario estacional inteligente que alerta automáticamente sobre temporalidades de alta demanda (Graduaciones, Navidad, Día del Niño, etc.).
   - Sección de publicaciones destacadas o favoritas para acceso y copiado ultrarrápido.

2. **Administrador de Productos (CRUD Completo):**
   - Configuración de dimensiones (Ancho, Alto, Profundidad), tiempo de corte y ensamble.
   - Cálculo automático de costos usando las fórmulas precisas del negocio (Costo de material de acuerdo al área, costo de máquina por minuto y mano de obra).
   - Generación automática de precios sugeridos basados en márgenes específicos.
   - Soporte para subida y compresión de múltiples imágenes en formato Base64 con lógica de fragmentación en chunks para archivos pesados.

3. **Gestor de Publicaciones:**
   - Banco de textos optimizados para redes sociales (Facebook, WhatsApp, Instagram).
   - Relación directa de publicaciones con productos para autocompletado de precios y descripciones.
   - Botón de copiado inteligente de contenido con un solo clic que actualiza métricas de uso y fecha de último uso en tiempo real.

4. **Cotizador Integrado:**
   - Selección dinámica de productos con detección automática de precios de mayoreo si la cantidad iguala o supera el mínimo configurado.
   - Configuración de cargos adicionales: Costo de Envío, Diseño de Personalización o Ensamble Extra.
   - Exportación de cotizaciones:
     - Formato de texto para envío directo a WhatsApp.
     - Impresión nativa estilizada lista para guardar en formato **PDF** de alta resolución con vectores reales.

5. **Galería Visual de Alta Definición:**
   - Organizada en formato bento-grid con un aspecto de 1:1, bordes dorados, animaciones de hover refinadas y soporte para Lightbox a pantalla completa con navegación nativa por teclado (`ESC`, `←`, `→`).

---

## 🛠️ Tecnologías y Configuración de Firebase

La persistencia de datos está unificada en **Firebase Realtime Database** usando reglas públicas de lectura y escritura para facilitar la flexibilidad en la fase de colaboración inicial.

La aplicación cuenta con un **módulo de inicialización automática**. Si la base de datos se detecta vacía al iniciar, se cargarán de forma automática:
- **15 Categorías iniciales** predeterminadas (Bodas, Graduaciones, Día del Niño, etc.).
- **8 Medidas estándar** de productos de MDF de Forja Laser.
- **9 Productos base** configurados con sus respectivas descripciones, dimensiones y precios.
- **7 Plantillas de mensajes** para uso comercial rápido.
- **1 Cuenta de usuario administrador inicial** (`admin` / `admin123`).

La autenticación se realiza de manera segura mediante encriptación cliente-servidor con hash **SHA-256** nativo.

---

## 🚀 Instrucciones de Despliegue (Deploy)

### 1. Prerrequisitos
Asegúrate de tener instalado en tu sistema local:
- [Node.js](https://nodejs.org/) (versión 18.0.0 o superior)
- Un gestor de paquetes como `npm` o `yarn`

### 2. Instalación Local
Para ejecutar y probar el panel de administración en tu computadora de manera local, sigue estos pasos:

```bash
# Clonar o descargar el repositorio
git clone <url-del-repositorio>
cd forja-laser-admin

# Instalar todas las dependencias requeridas
npm install

# Iniciar el servidor de desarrollo local
npm run dev
```

La aplicación estará disponible para previsualizar en tu navegador en `http://localhost:3000`.

### 3. Compilación para Producción (Build)
Para compilar la aplicación en un paquete optimizado y estático listo para subir a servidores como **GitHub Pages**, **Vercel** o **Netlify**:

```bash
# Generar los archivos listos para despliegue
npm run build
```

Esto creará un directorio llamado `/dist` en la raíz del proyecto. El contenido de esta carpeta es completamente estático y contiene el `index.html` compilado, scripts de JavaScript minimizados y hojas de estilo optimizadas.

### 4. Despliegue Automático en GitHub Pages (Sin Compilar en tu PC)

Gracias al flujo de trabajo automatizado que he configurado en `.github/workflows/deploy.yml`, **no necesitas compilar ni instalar nada en tu computadora local** para subir tu página a GitHub Pages. 

Sigue estos sencillos pasos:

1. **Exporta y descarga el archivo ZIP** de tu aplicación desde el menú de configuración de AI Studio, o expórtalo directamente a un repositorio de tu cuenta de GitHub.
2. Si descargaste el archivo ZIP, descomprímelo en una carpeta de tu computadora.
3. Crea un repositorio en GitHub (puede ser público o privado).
4. Sube todos los archivos descomprimidos directamente a la rama principal (generalmente llamada `main` o `master`) de tu repositorio de GitHub. No necesitas subir la carpeta `dist`, solo sube el código fuente que descargaste (carpetas `src`, `.github`, archivo `package.json`, etc.).
5. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
6. En la barra lateral izquierda, haz clic en **Pages**.
7. En la sección **Build and deployment**, bajo **Source**, selecciona **GitHub Actions** en el menú desplegable (en lugar de "Deploy from a branch").
8. ¡Listo! GitHub detectará automáticamente el archivo `.github/workflows/deploy.yml`, compilará el código por ti en la nube de forma segura y publicará tu sitio en un enlace como: `https://<tu-usuario>.github.io/<nombre-del-repositorio>/`.
9. Cada vez que actualices el código o subas un cambio a tu repositorio, la página se actualizará sola de manera inmediata.

---

## ⚙️ Configuración de Secretos de la API

La aplicación requiere la clave secreta de Firebase para conectarse a la base de datos en tiempo real. Esta clave se inyecta de forma segura a través de las variables de entorno. Asegúrate de configurar en tu archivo `.env` o en el panel de secretos del servidor de despliegue la siguiente variable:

```env
GEMINI_API_KEY="Tu_Clave_Secreta_Aqui"
```

---

*Desarrollado con pasión para **Forja Laser** - Impulsando la carpintería láser y la personalización de MDF de alta calidad en Ixtapaluca, Estado de México.*
