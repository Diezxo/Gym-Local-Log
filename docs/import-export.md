# Importación y Exportación de Datos

Puedes sacar o ingresar tus datos en Gym-Local-Log en cualquier momento a través del historial de entrenamientos (`/data`). Tienes a tu disposición dos formatos: **JSON** y **CSV**.

## Opciones de Exportación

*   **Mes Actual (JSON/CSV):** Descarga únicamente los registros del mes que estás visualizando.
    *   *Nombre de archivo sugerido:* `2026-07.json` o `2026-07.csv`.
*   **Todo el historial (JSON/CSV):** Extrae *todos* los entrenamientos desde que empezaste a usar la app.
    *   *Nombre de archivo sugerido:* `gym_backup_YYYY-MM-DD.json/csv`.

---

## Importación de Archivos (JSON)

### Validación Estricta
El servicio de importación (`ExportService`) audita el archivo entrante antes de permitir su escritura en IndexedDB.
*   **Comprobación de tipos y formatos:** Las fechas deben ser `YYYY-MM-DD`, el `mesId` debe ser `YYYY-MM`, las repeticiones/pesos/distancias deben ser numéricas y $\ge 0$.
*   **Reporte de Errores:** Si el archivo es inválido, la importación se cancela y muestra exactamente dónde falló (ej. `raíz.logs[3].ejercicios[0].series[1].peso: debe ser número ≥ 0`), listando hasta un máximo de 20 errores a la vez.

### Comportamiento (Merge/Deduplicación)
Si ya tienes datos locales y subes un JSON con entrenamientos que caen en las mismas fechas:
*   Se agregan como nuevos logs, **siempre y cuando la fecha y la rutina no sean idénticas**.
*   Actualmente no hay una fusión automática a nivel de series si realizas la misma rutina el mismo día; si importas un archivo redundante con exactamente la misma fecha y `templateId`, podrías tener duplicados a menos que la base de datos IndexedDB controle la llave primaria (la llave por defecto en `monthly-logs` es el `mesId`, por lo que el objeto mensual sobrescribirá el existente o lo fusionará reemplazando los arrays internos según la implementación del `importMonthlyArchive`).

---

## Importación de Archivos (CSV)

La herramienta incluye un parseador compatible con la especificación `RFC4180` (maneja correctamente comas y comillas dentro de los campos de notas).

### Reglas de Importación CSV
1.  **Correspondencia de Rutinas:** Para que la app sepa qué "template" aplicar a tus ejercicios sueltos, la columna **Rutina** del CSV **debe coincidir exactamente con el nombre de una rutina existente en tu aplicación** (ignorando mayúsculas/minúsculas).
2.  **Política de Rechazo:** Si una fila pertenece a una Rutina que *no existe* en tu app, **la fila es ignorada (rechazada)**. La app te avisará de cuántas filas fueron rechazadas. Asegúrate de crear tus Rutinas (Templates) primero antes de importar.
3.  **Conversión:** Las filas se agrupan por `Fecha` y `Rutina` para reconstruir la estructura anidada de `Ejercicios` -> `Series` o `Cardio`.

---

## Copias de Seguridad Automáticas (Auto-Backup)

Si usas Google Chrome/Edge y tienes activa la sincronización por carpeta (File System Access API):
1.  Al finalizar y guardar un entrenamiento, la app actualiza el archivo maestro mensual (ej. `2026-07.json`).
2.  Inmediatamente después, genera una copia de seguridad rotativa con la marca de tiempo exacta (ej. `2026-07_bak_1658428394.json`).
3.  Si hay más de **7 copias de seguridad** para el mismo mes, borra la más antigua automáticamente.
Esto garantiza que si el JSON maestro se corrompe (por un fallo eléctrico o de sincronización en la nube tipo Google Drive/Dropbox de tu PC), siempre tienes los últimos 7 snapshots intactos.
