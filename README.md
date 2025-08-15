# Siembra pais 

Agroflow es un sistema moderno para la gestión de fincas, agricultores, parcelas, inspecciones y financiamiento agrícola. Está construido con React 18, Vite y TailwindCSS, e integra Supabase como backend para autenticación y base de datos. Incluye paneles de control, gestión de usuarios y visualización de datos agrícolas.

## 🚀 Características principales

- **React 18** y **Vite** para desarrollo rápido y moderno.
- **Redux Toolkit** para gestión de estado.
- **TailwindCSS** y plugins para estilos responsivos y utilitarios.
- **React Router v6** para rutas declarativas.
- **Supabase** como backend: autenticación, base de datos y almacenamiento.
- **D3.js** y **Recharts** para visualización de datos.
- **React Hook Form** para formularios eficientes.
- **Framer Motion** para animaciones.
- **Jest** y **React Testing Library** para testing.

## 📋 Prerrequisitos

- Node.js (v16.x o superior)
- npm o yarn
- Cuenta y proyecto en [Supabase](https://supabase.com/) (ver sección de entorno)

## 🛠️ Instalación y ejecución local

1. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

2. Configura las variables de entorno en un archivo `.env` (ver ejemplo más abajo).

3. Inicia el servidor de desarrollo:
   ```bash
   npm run start
   # o
   yarn start
   ```

## 📁 Estructura del proyecto

```
agroflow/
├── public/             # Assets estáticos y manifest
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Vistas y paneles principales
│   ├── contexts/       # Contextos globales (ej. Auth)
│   ├── utils/          # Servicios de negocio (auth, farmers, parcels, etc)
│   ├── styles/         # Estilos globales y Tailwind
│   ├── App.jsx         # Componente raíz
│   ├── Routes.jsx      # Definición de rutas
│   └── index.jsx       # Punto de entrada
├── supabase/           # Migraciones y configuración de BD
├── .env                # Variables de entorno (no versionar)
├── package.json        # Dependencias y scripts
├── tailwind.config.js  # Configuración Tailwind
├── vite.config.mjs     # Configuración Vite
└── README.md           # Este archivo
```

## 🧩 Servicios principales

El sistema implementa servicios para:
- Gestión de agricultores (farmers)
- Gestión de parcelas (parcels)
- Gestión y flujo de inspecciones (inspections)
- Solicitudes y automatización de financiamiento (financings)
- Autenticación y perfiles de usuario (Supabase Auth)
- Visualización de métricas y reportes agrícolas

La lógica de negocio se encuentra en `src/utils/` y las vistas principales en `src/pages/`.

## 🗂️ Entorno y Supabase

Se requiere un archivo `.env` con las siguientes variables (ejemplo):

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

Puedes obtener estos valores desde tu panel de Supabase, sección Project Settings > API.

## 🎨 Estilos y diseño

- Tailwind CSS y plugins: forms, typography, aspect-ratio, container-queries, fluid-type, animate, elevation.
- Diseño completamente responsivo y adaptable a dispositivos móviles.

## 📦 Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Para previsualizar el build localmente:

```bash
npm run serve
```

Para desplegar en servicios como Vercel, Netlify o tu propio hosting, sube 
el contenido de `dist/`.

## 🙏 Créditos y agradecimientos

- Construido con React, Vite, TailwindCSS y Supabase.
- Inspirado por la comunidad open-source.
- Desarrollado con ❤️ para el sector agrícola.

## 🌱 Agroflow - Sistema de Gestión Agrícola

Plataforma integral para la gestión de agricultores, parcelas, inspecciones y financiamiento agrícola.

## 🚀 Características Principales

### 👨‍🌾 Gestión de Agricultores
- Registro y seguimiento de agricultores
- Perfiles detallados con historial completo
- Sistema de clasificación por riesgo
- Documentación digitalizada

### 🌾 Gestión de Parcelas
- Mapeo y geolocalización de parcelas
- Seguimiento de cultivos
- Historial de producción
- Análisis de suelo y condiciones ambientales

### 🔍 Flujo de Inspecciones
- Programación de inspecciones
- Formularios digitales personalizables
- Carga de evidencia fotográfica
- Reportes automáticos

### 💰 Gestión de Financiamiento
- Solicitudes de crédito agrícola
- Evaluación de riesgo crediticio
- Seguimiento de pagos
- Generación de contratos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework**: React 18 + Vite
- **Estilos**: TailwindCSS + CSS Modules
- **Estado**: React Context + Redux Toolkit
- **Enrutamiento**: React Router v6
- **Gráficos**: Recharts
- **Formularios**: React Hook Form + Yup
- **Mapas**: Leaflet + React Leaflet

### Backend (Supabase)
- **Autenticación**: Supabase Auth
- **Base de Datos**: PostgreSQL
- **Almacenamiento**: Supabase Storage
- **Funciones Serverless**: Edge Functions

### Herramientas de Desarrollo
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **CI/CD**: GitHub Actions

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes UI reutilizables
│   └── ui/             # Componentes de UI atómicos
├── contexts/           # Contextos de React (Auth, Theme, etc.)
├── features/           # Características de la aplicación
│   ├── farmers/        # Módulo de agricultores
│   ├── parcels/        # Módulo de parcelas
│   ├── inspections/    # Módulo de inspecciones
│   └── financing/      # Módulo de financiamiento
├── pages/              # Componentes de página
│   ├── auth/           # Autenticación
│   ├── dashboard/      # Paneles de control
│   └── ...
├── services/           # Lógica de negocio
│   ├── api/            # Clientes API
│   └── supabase/       # Servicios de Supabase
├── styles/             # Estilos globales
├── utils/              # Utilidades
└── App.jsx             # Punto de entrada
```

## 🚀 Comenzando

### Requisitos Previos
- Node.js 16+
- npm 8+ o yarn 1.22+
- Cuenta de Supabase

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/agroflow.git
   cd agroflow
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn
   ```

3. Configura las variables de entorno:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

4. Inicia el servidor de desarrollo:
   ``
   npm start
   npm run start  
   ``

## 🏗️ Construcción para Producción

Para crear una versión optimizada para producción:

```bash
npm run build
# o
yarn build
```

Los archivos de producción se generarán en el directorio `dist/`.

## 🔧 Variables de Entorno

| Variable                | Requerido | Descripción                             |
|-------------------------|-----------|-----------------------------------------|
| VITE_SUPABASE_URL      | Sí        | URL de tu proyecto Supabase             |
| VITE_SUPABASE_ANON_KEY | Sí        | Clave anónima de Supabase               |
| VITE_API_BASE_URL      | No        | URL base para APIs personalizadas       |

## 📊 Base de Datos

El esquema de la base de datos incluye las siguientes tablas principales:

- `farmers`: Información de agricultores
- `parcels`: Detalles de parcelas
- `inspections`: Registros de inspecciones
- `financing`: Solicitudes de financiamiento
- `user_profiles`: Perfiles de usuario

## 🤝 Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.

## 📧 Contacto

DEIkrip- deikermadridmanz@gmail.com

Enlace del Proyecto: [https://github.com/DEIKRIP/agroflow](https://github.com/DEIKRIP/agroflow)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) por su increíble plataforma
- [TailwindCSS](https://tailwindcss.com/) por los estilos
- La comunidad de código abierto
-ING FRANCISCO QUIJADA POR LA IDEA 💡
