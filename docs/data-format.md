# Formato de Datos (JSON y CSV)

Gym-Local-Log guarda toda la información de manera local. Esta página documenta la estructura exacta de los datos para que puedas entender cómo se almacena o si deseas crear scripts personalizados para analizar o importar tus rutinas.

## 1. Archivo Mensual (JSON)

Los entrenamientos se agrupan por mes en un objeto `ArchivoMensual`. Cuando exportas o sincronizas tus datos mediante File System Access API, los archivos se guardan con el nombre `YYYY-MM.json` (por ejemplo, `2026-07.json`).

### Esquemas

#### `ArchivoMensual`
| Campo | Tipo | Descripción |
|---|---|---|
| `mesId` | `string` | ID del mes en formato `YYYY-MM` (ej. "2026-07"). |
| `schemaVersion` | `number?` | Versión del esquema (actualmente `1`). Útil para futuras migraciones. |
| `logs` | `LogDiario[]` | Array con todos los entrenamientos de ese mes. |

#### `LogDiario` (Un entrenamiento)
| Campo | Tipo | Descripción |
|---|---|---|
| `fecha` | `string` | Fecha del entrenamiento en formato `YYYY-MM-DD`. |
| `templateId` | `string` | ID de la rutina (template) que se utilizó. |
| `ejercicios` | `EjercicioLog[]` | Array de ejercicios realizados durante la sesión. |
| `notas` | `string` | Notas generales del entrenamiento. |

#### `EjercicioLog` (Un ejercicio realizado)
| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | `string` | Nombre del ejercicio (ej. "Sentadilla libre"). |
| `tipo` | `'fuerza' \| 'cardio'` | Tipo de ejercicio. Determina si usa `series` o `cardio`. |
| `tags` | `MuscleTag[]?` | Array opcional de etiquetas musculares (ej. `["Pierna", "Glúteo"]`). |
| `series` | `SerieFuerza[]?` | Solo si `tipo` es `'fuerza'`. Las series realizadas. |
| `cardio` | `LogCardio?` | Solo si `tipo` es `'cardio'`. Los datos cardiovasculares. |

#### `SerieFuerza`
| Campo | Tipo | Descripción |
|---|---|---|
| `numero` | `number` | Número de la serie (1, 2, 3...). |
| `peso` | `number` | Peso levantado en la unidad elegida (kg o lbs). |
| `reps` | `number` | Repeticiones completadas. |

#### `LogCardio`
| Campo | Tipo | Descripción |
|---|---|---|
| `distanciaKm` | `number` | Distancia recorrida en kilómetros. |
| `tiempoMinutos` | `number` | Tiempo de la actividad en minutos. |
| `notasTecnica` | `string?` | Notas adicionales. |

### Ejemplo Completo JSON

```json
{
  "mesId": "2026-07",
  "schemaVersion": 1,
  "logs": [
    {
      "fecha": "2026-07-16",
      "templateId": "push-day-id",
      "notas": "Buen entreno, progresando en banca",
      "ejercicios": [
        {
          "nombre": "Press de Banca Plano",
          "tipo": "fuerza",
          "tags": ["Pecho", "Tríceps"],
          "series": [
            { "numero": 1, "peso": 60, "reps": 10 },
            { "numero": 2, "peso": 70, "reps": 8 },
            { "numero": 3, "peso": 80, "reps": 6 }
          ]
        },
        {
          "nombre": "Cinta de Correr",
          "tipo": "cardio",
          "tags": ["Cardio"],
          "cardio": {
            "distanciaKm": 5.2,
            "tiempoMinutos": 30,
            "notasTecnica": "Trote ligero post-entreno"
          }
        }
      ]
    }
  ]
}
```

---

## 2. Formato CSV

El formato CSV es una versión aplanada (denormalizada) de tus logs, ideal para análisis en Excel, Google Sheets, o Python/Pandas. Cada serie de fuerza y cada registro de cardio ocupa una fila independiente.

**Columnas:**
`Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas`

### Reglas del CSV
* **Fecha:** `YYYY-MM-DD`.
* **Rutina:** El nombre exacto de la rutina (template) a la que pertenece (se resuelve automáticamente al importar/exportar).
* **Tipo:** `Fuerza` o `Cardio`.
* **Fuerza:**
  * Columna 5 (Serie/Distancia): Número de serie
  * Columna 6 (Reps/Tiempo): Repeticiones
  * Columna 7 (Peso/Notas): Peso levantado
* **Cardio:**
  * Columna 5 (Serie/Distancia): Distancia en km
  * Columna 6 (Reps/Tiempo): Tiempo en minutos
  * Columna 7 (Peso/Notas): Notas adicionales

### Ejemplo CSV

```csv
Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas
2026-07-16,Empuje,Press de Banca Plano,Fuerza,1,10,60
2026-07-16,Empuje,Press de Banca Plano,Fuerza,2,8,70
2026-07-16,Empuje,Press de Banca Plano,Fuerza,3,6,80
2026-07-16,Empuje,Cinta de Correr,Cardio,5.2,30,Trote ligero post-entreno
```
