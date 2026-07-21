# Gym-Local-Log 🏋️‍♂️

![Offline First](https://img.shields.io/badge/Offline-First-00f2fe?style=for-the-badge&logo=offline)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-a252ff?style=for-the-badge&logo=pwa)
![Angular](https://img.shields.io/badge/Angular-v19-DD0031?style=for-the-badge&logo=angular)

**Gym-Local-Log** es una aplicación progresiva (PWA) de registro de entrenamiento de fuerza y cardio, diseñada para ser rápida, privada y 100% offline. No hay servidores en la nube, no necesitas crear cuentas y eres el único dueño absoluto de tus datos.

## ¿Por qué Gym-Local-Log?

La mayoría de las apps de gimnasio requieren suscripciones o guardan tus datos en la nube. Gym-Local-Log guarda tu progreso en tu propio dispositivo a través de IndexedDB y, de manera opcional, permite sincronizar automáticamente archivos JSON a una carpeta local de tu disco (ej. la carpeta de Dropbox o Google Drive en tu PC). 

## Características

* 📱 **PWA Offline**: Instálala en iOS/Android/Windows y úsala sin conexión a internet.
* 📝 **Rutinas Personalizadas**: Crea tus propias plantillas de empuje, tirón, pierna, etc.
* 📈 **Progresión Inteligente**: El motor de progresión te sugiere automáticamente tus pesos y repeticiones basados en tu última sesión (Alertas de salto de carga).
* 🏃‍♂️ **Soporte Híbrido**: Registra tanto series de fuerza como actividades de cardio.
* 📊 **Estadísticas Detalladas**: Dashboard mensual con tu racha de días, último récord personal, gráficos de progresión y mapa de calor de consistencia.
* 💾 **Tus Archivos (CSV/JSON)**: Importa o exporta historiales masivamente para análisis en Excel.
* 🗄️ **Sincronización Local FS**: Permite enlazar una carpeta de tu ordenador para guardar archivos directamente sin tener que descargar, gracias a la **File System Access API**.

---

## Instalación y Desarrollo

### Requisitos previos
* Node.js v22+
* npm

### Inicio rápido
Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/Diezxo/Gym-Local-Log.git
cd Gym-Local-Log
npm install
```

Arranca el servidor de desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:4200/`.

### Producción (PWA Activa)
Para que el Service Worker y el modo offline funcionen, debes generar la build de producción:

```bash
npm run build
```
Luego sirve la carpeta `dist/gym-local-log/browser` con un servidor local estático como `http-server` o `serve`.

---

## Documentación Técnica

Para conocer más sobre cómo se almacenan y estructuran los datos, visita:

1. [**Almacenamiento Offline** (`docs/offline-storage.md`)](docs/offline-storage.md) - Arquitectura y File System Access API.
2. [**Importar y Exportar** (`docs/import-export.md`)](docs/import-export.md) - Reglas y lógica de copias de seguridad.
3. [**Formato de Datos** (`docs/data-format.md`)](docs/data-format.md) - Esquemas JSON, tablas y especificación del CSV.
4. [**Arquitectura** (`docs/architecture.md`)](docs/architecture.md) - Diagramas de flujo y stack completo.

## Próximos Pasos (TODO)
- **Migración a Backend (Firebase):** Crear un backend con catálogo estandarizado de ejercicios (incluyendo descripciones, GIFs demostrativos y métricas globales).

## Contribuir

Siéntete libre de abrir issues o pull requests para mejoras y nuevas funcionalidades.

## Licencia

[MIT License](LICENSE)
