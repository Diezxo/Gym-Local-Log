# Arquitectura Técnica

Gym-Local-Log utiliza un stack moderno y ligero enfocado en velocidad y fiabilidad offline.

## Tecnologías Principales

*   **Framework:** Angular v19 (Standalone Components).
*   **Estilos:** TailwindCSS v4 (Integrado vía Angular CLI).
*   **Estado:** Angular Signals (`signal`, `computed`, `effect`). No hay NgRx, Redux ni observadores (RxJS) complejos; el estado es mayormente local a los componentes o expuesto sincrónicamente por los servicios.
*   **Base de Datos Local:** IndexedDB usando las librerías `idb` (wrapper de promesas) e `idb-keyval` (para configuraciones rápidas tipo key-value).
*   **Sincronización de Archivos:** File System Access API nativo (HTML5).
*   **Offline/PWA:** `@angular/service-worker` configurado en `ngsw-config.json` para pre-cacheo de todos los estáticos (se requiere compilar en modo producción para activar).

---

## Estructura de Componentes y Rutas

La aplicación es un SPA (Single Page Application) con carga perezosa (lazy-loading). Todos los componentes son `standalone`.

**Root:** `AppComponent` (Inyecta la navegación inferior y aloja el `<router-outlet>`).

*   👉 **`/dashboard`** (`DashboardComponent`): Resumen de métricas, rachas, volumen mensual, gráfico histórico e historial de PRs.
*   👉 **`/workout`** (`WorkoutComponent`): La pantalla principal de entrenamiento activo. A su vez contiene componentes hijos:
    *   `ExerciseStrengthComponent`: Controles +/-, registro de series por fila, sugerencias de progresión.
    *   `ExerciseCardioComponent`: Inputs de distancia, tiempo y cronómetro nativo.
*   👉 **`/templates`** (`TemplateListComponent`): Explorador de rutinas creadas.
*   👉 **`/templates/:id`** (`TemplateEditorComponent`): Creador y editor de rutinas, permite asignar `tags` musculares.
*   👉 **`/data`** (`DataManagementComponent`): Gestor del historial, borrado manual y entrada/salida de datos (JSON/CSV).
*   👉 **`/settings`** (`SettingsComponent`): Configuración general (unidad métrica, incremento de peso, selección de directorio de sincronización local).

---

## Capa de Servicios

Toda la lógica de negocio se aísla en servicios Injectables de nivel root (`providedIn: 'root'`):

1.  **`DbService`:** El corazón de la app. Inicia la DB IndexedDB, controla los templates (`getTemplates`, `saveTemplate`), las lecturas/escrituras de los logs mensuales, y expone los métodos `syncFromFileSystem()` y `syncToFileSystem()` para invocar la sincronización con disco.
2.  **`FileSystemService`:** Maneja exclusivamente las llamadas a la File System Access API (abrir picker, chequear permisos, leer entradas `dirHandle.entries()`, y escribir archivos JSON y copias de seguridad rotativas).
3.  **`ProgressionService`:** Motor de la sobrecarga progresiva. Lee el historial de un ejercicio para calcular las sugerencias de la sesión actual (Si $\ge 12$ reps, alerta de salto de carga; si $\ge 8$ suma repetición).
4.  **`ExportService`:** Convierte los objetos JSON a CSV y viceversa, maneja la validación fuerte (`validateArchivoMensual`), y expulsa las descargas a través de BLOBs/ObjectURLs en el navegador.

---

## Diagrama de Flujo (Guardado de un Entrenamiento)

```text
 1. Usuario hace clic en "Finalizar Entrenamiento" en WorkoutComponent
    |
    v
 2. WorkoutComponent agrupa todas las señales locales en un objeto `LogDiario`
    |
    v
 3. Se invoca `DbService.addLogToMonth(LogDiario)`
    |
    v
 4. DbService actualiza IndexedDB (tabla `monthly-logs`) transaccionalmente.
    |
    v
 5. DbService chequea si hay un directorio local autorizado (File System).
    |
    +-- [SI hay carpeta local enlazada] --> 6. Invoca FileSystemService.writeJsonFile()
                                             y luego FileSystemService.writeBackupJson()
                                             (Se guardan archivos físicos silenciosamente)
    |
    +-- [NO hay carpeta local enlazada] --> (Finaliza. Datos solo en navegador)
    |
    v
 7. WorkoutComponent notifica éxito, resetea estado local y redirige al Dashboard.
```
