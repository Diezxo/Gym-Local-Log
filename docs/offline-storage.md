# Almacenamiento Offline y Arquitectura

Gym-Local-Log está diseñado con una mentalidad **100% Offline-First**. No hay servidores en la nube, ni cuentas, ni bases de datos remotas. Todo reside en tu dispositivo y está bajo tu control.

## ¿Dónde viven mis datos?

El flujo de datos principal utiliza **IndexedDB** como capa transaccional rápida (para la UI) y el **File System local** de tu dispositivo como fuente de la verdad a largo plazo (solo en navegadores compatibles).

### 1. IndexedDB (Base de datos del navegador)
Utilizamos el wrapper `idb` para interactuar con IndexedDB.
*   **Nombre DB:** `gym-local-log`
*   **Stores (Tablas):**
    *   `templates`: Almacena tus rutinas personalizadas.
    *   `monthly-logs`: Almacena tus entrenamientos agrupados por mes (`ArchivoMensual`).
    *   `settings`: Preferencias del usuario (unidad de peso, incrementos, tema).

### 2. File System Access API (Archivos Locales)
Esta potente API moderna de HTML5 nos permite leer y escribir directamente en una carpeta de tu ordenador/móvil (previa autorización).
*   **Sincronización:** Cuando eliges una carpeta, la app lee todos los archivos `YYYY-MM.json` y los sincroniza con IndexedDB.
*   **Rotación de Backups:** Por seguridad, cada vez que la app guarda cambios, crea un backup versionado con la marca de tiempo: `YYYY-MM_bak_TIMESTAMP.json`. Mantenemos un máximo de **7 snapshots** recientes por mes para prevenir pérdida de datos por corrupción.

### 3. PWA & Service Worker
Gym-Local-Log es una Progressive Web App (PWA). Se vale de `@angular/service-worker` para guardar en caché:
*   HTML, JS y CSS.
*   Fuentes web e iconos.
*   Imágenes estáticas.

**Solo se activa en producción (`npm run build`).** Una vez que visitas la página y el service worker se instala, la aplicación cargará instantáneamente incluso en modo avión. Puedes "instalarla" como una app nativa desde Chrome/Edge/Safari (Añadir a pantalla de inicio).

---

## Flujo de Datos (Arquitectura)

```text
[ Interfaz UI (Componentes Angular) ]
        |       ^
 (Guarda/Lee)   | (Señales reactivas)
        v       |
[ DbService (IndexedDB + idb-keyval) ] <---> [ IndexedDB ] (Capas transaccionales ultra-rápidas)
        |
        | (On Save / Sincronización)
        v
[ FileSystemService ]
        |
        | (Guarda Archivos Mensuales + Auto-Backups)
        v
[ Sistema de Archivos Local (FSAA) ]
```

## Compatibilidad de Navegadores

Debido al uso de APIs de vanguardia, la experiencia difiere según el navegador:

| Navegador | PWA / Offline | IndexedDB | Sincronización en Carpeta Local (FSAA) | Notas |
| :--- | :---: | :---: | :---: | :--- |
| **Chrome / Edge (Desktop/Android)** | ✅ | ✅ | ✅ | **Experiencia Óptima.** Soporte completo. |
| **Firefox** | ✅ | ✅ | ⚠️ No nativo | Guarda en IndexedDB pero tienes que exportar/importar archivos manualmente (no puede leer/escribir directorios vivos solos). |
| **Safari / iOS** | ✅ | ✅ | ❌ No soportado | Apple aún no implementa FSAA. Debes usar los botones de importar/exportar manualmente. |

**Nota sobre dispositivos móviles:** Incluso si tu navegador no soporta la selección de *carpetas* persistentes, el motor de IndexedDB guardará tus rutinas localmente en el navegador para siempre (o hasta que borres la caché del navegador). Usa la función de Exportar regularmente si estás en iOS/Firefox.
