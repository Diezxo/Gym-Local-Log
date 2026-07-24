import { Injectable, inject } from '@angular/core';
import { WorkoutUseCases } from '../use-cases/workout.use-cases';
import { RoutineUseCases } from '../use-cases/routine.use-cases';
import { MonthlyArchive, WorkoutSession, ExerciseLog } from '../models/interfaces';
import { generateId } from '../utils/generate-id';

// ─── Import Result ───
export interface ImportResult {
  imported: number;   // number of monthly archives imported
  rejected: number;   // number of rows/logs rejected
  errors: string[];   // human-readable error messages
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private workoutUseCases = inject(WorkoutUseCases);
  private routineUseCases = inject(RoutineUseCases);

  constructor() {}

  /**
   * Export monthly archive as JSON
   */
  async exportJSON(monthId: string): Promise<void> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const monthWorkouts = allWorkouts.filter(w => w.date.startsWith(monthId));
    
    if (monthWorkouts.length === 0) {
      throw new Error(`No data for month ${monthId}`);
    }

    const archive: MonthlyArchive = {
      monthId,
      schemaVersion: 3,
      logs: monthWorkouts
    };

    const json = JSON.stringify(archive, null, 2);
    this.downloadFile(json, `${monthId}.json`, 'application/json');
  }

  /**
   * Export all months as a single JSON
   */
  async exportAllJSON(): Promise<void> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const allRoutines = await this.routineUseCases.getAllRoutines();

    if (allWorkouts.length === 0 && allRoutines.length === 0) {
      throw new Error('No data to export');
    }

    const archivesMap = new Map<string, MonthlyArchive>();
    for (const w of allWorkouts) {
      const monthId = w.date.substring(0, 7);
      if (!archivesMap.has(monthId)) {
        archivesMap.set(monthId, { monthId, schemaVersion: 3, logs: [] });
      }
      archivesMap.get(monthId)!.logs.push(w);
    }
    
    const archives = Array.from(archivesMap.values());
    const fullExport = {
      exportVersion: 1,
      routines: allRoutines,
      archives: archives
    };

    const json = JSON.stringify(fullExport, null, 2);
    this.downloadFile(json, `gym_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  /**
   * Export monthly archive as CSV
   */
  async exportCSV(monthId: string): Promise<void> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const monthWorkouts = allWorkouts.filter(w => w.date.startsWith(monthId));
    
    if (monthWorkouts.length === 0) {
      throw new Error(`No data for month ${monthId}`);
    }

    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Date,Routine,Exercise,Type,Set/Distance_m,Reps/Time_min,Weight_kg/Notes');

    for (const log of monthWorkouts) {
      const templateName = templateMap.get(log.routineId) ?? log.routineId;
      rows.push(...this.logToCSVRows(log, templateName));
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `${monthId}.csv`, 'text/csv');
  }

  /**
   * Export all months as CSV
   */
  async exportAllCSV(): Promise<void> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    if (allWorkouts.length === 0) {
      throw new Error('No data to export');
    }

    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Date,Routine,Exercise,Type,Set/Distance_m,Reps/Time_min,Weight_kg/Notes');

    for (const log of allWorkouts) {
      const templateName = templateMap.get(log.routineId) ?? log.routineId;
      rows.push(...this.logToCSVRows(log, templateName));
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `gym_backup_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  /**
   * Import JSON (Strict validation)
   * Fix #8: Use file.text() instead of FileReader + Promise wrapper.
   * The modern API is properly awaitable and eliminates the async-in-callback
   * pattern that could produce unhandled floating promises.
   */
  async importJSON(file: File): Promise<string> {
    let data: any;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error('Invalid JSON file');
    }

    if (data.exportVersion === 1) {
      // New full export format
      if (Array.isArray(data.routines)) {
        for (const r of data.routines) {
          await this.routineUseCases.createRoutine(r);
        }
      }
      const allLogsToImport: WorkoutSession[] = [];
      if (Array.isArray(data.archives)) {
        for (const monthData of data.archives) {
          for (const log of monthData.logs) {
            const session: WorkoutSession = {
              id: log.id || generateId(),
              schemaVersion: 3,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: log.version || 1,
              syncStatus: log.syncStatus || 'local_only',
              deviceId: log.deviceId || 'local',
              date: log.date || log.fecha,
              routineId: log.routineId || log.templateId,
              notes: log.notes || log.notas || '',
              exercises: log.exercises || log.ejercicios || []
            };
            allLogsToImport.push(session);
            await this.workoutUseCases.updateWorkoutSession(session);
          }
        }
      }
      await this.reconstructRoutines(allLogsToImport);
      return 'all';
    } else if (Array.isArray(data)) {
      const allErrors: string[] = [];
      for (let i = 0; i < data.length; i++) {
        const errs = this.validateMonthlyArchive(data[i], `array[${i}]`);
        allErrors.push(...errs);
      }
      if (allErrors.length > 0) {
        throw new Error(`Validation errors (${allErrors.length}):\n• ${allErrors.slice(0, 10).join('\n• ')}`);
      }
      const allLogsToImport: WorkoutSession[] = [];
      for (const monthData of data) {
        for (const log of monthData.logs) {
          const session: WorkoutSession = {
            id: log.id || generateId(),
            schemaVersion: 3,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: log.version || 1,
            syncStatus: log.syncStatus || 'local_only',
            deviceId: log.deviceId || 'local',
            date: log.date || log.fecha,
            routineId: log.routineId || log.templateId,
            notes: log.notes || log.notas || '',
            exercises: log.exercises || log.ejercicios || []
          };
          allLogsToImport.push(session);
          await this.workoutUseCases.updateWorkoutSession(session);
        }
      }
      await this.reconstructRoutines(allLogsToImport);
      return 'all';
    } else {
      const errs = this.validateMonthlyArchive(data, 'root');
      if (errs.length > 0) {
        throw new Error(`Validation errors (${errs.length}):\n• ${errs.slice(0, 10).join('\n• ')}`);
      }
      const allLogsToImport: WorkoutSession[] = [];
      for (const log of data.logs) {
        const session: WorkoutSession = {
          id: log.id || generateId(),
          schemaVersion: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: log.version || 1,
          syncStatus: log.syncStatus || 'local_only',
          deviceId: log.deviceId || 'local',
          date: log.date || log.fecha,
          routineId: log.routineId || log.templateId,
          notes: log.notes || log.notas || '',
          exercises: log.exercises || log.ejercicios || []
        };
        allLogsToImport.push(session);
        await this.workoutUseCases.updateWorkoutSession(session);
      }
      await this.reconstructRoutines(allLogsToImport);
      return data.monthId || data.mesId;
    }
  }

  private async reconstructRoutines(logs: WorkoutSession[]) {
    const existingRoutines = await this.routineUseCases.getAllRoutines();
    const existingIds = new Set(existingRoutines.map(r => r.id));

    // Group logs by routineId to find the most recent one for the template
    const logsByRoutine = new Map<string, WorkoutSession>();
    for (const log of logs) {
      if (!existingIds.has(log.routineId)) {
        const existing = logsByRoutine.get(log.routineId);
        if (!existing || log.date > existing.date) {
          logsByRoutine.set(log.routineId, log);
        }
      }
    }

    for (const [routineId, latestLog] of logsByRoutine.entries()) {
      let name = routineId
        .replace(/-\d{13}$/, '') // remove timestamp
        .replace(/-/g, ' ') // replace dashes
        .replace(/\b\w/g, l => l.toUpperCase()); // capitalize

      if (routineId === 'df9a9acd-dcc5-4b89-92f4-6dcc9eaaff0b') name = 'Espalda y Biceps';
      else if (routineId === 'custom' || /^[0-9a-f]{8}-/.test(routineId)) {
         name = 'Rutina ' + latestLog.date;
      }

      const routine: import('../models/interfaces').Routine = {
        id: routineId,
        schemaVersion: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'local',
        version: 1,
        syncStatus: 'local_only',
        name,
        exercises: latestLog.exercises.map(e => ({
          exerciseId: e.exerciseId || generateId(),
          name: e.name,
          type: e.type,
          tags: e.tags
        }))
      };
      await this.routineUseCases.createRoutine(routine);
    }
  }


  /**
   * Import CSV
   * Fix #8: Use file.text() instead of FileReader + Promise wrapper.
   */
  async importCSV(file: File): Promise<ImportResult> {
    const text = await file.text();
    const lines = this.splitCSVLines(text);

    if (lines.length < 2) {
      throw new Error('CSV is empty or only has headers');
    }

    const header = lines[0].toLowerCase();
    if (!(header.includes('fecha') || header.includes('date')) || !(header.includes('rutina') || header.includes('routine'))) {
      throw new Error('Invalid CSV format: missing Date/Routine columns');
    }

    const templates = await this.routineUseCases.getAllRoutines();
    const templateMap = new Map(templates.map(t => [t.name.trim().toLowerCase(), t.id]));

    const errors: string[] = [];
    const rejectedRows: string[] = [];
    const logMap = new Map<string, WorkoutSession>();

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVRow(lines[i]);
      if (row.length < 4) continue;

      const [date, routine, exercise, type, col5 = '', col6 = '', col7 = ''] = row.map(s => s.trim());

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Row ${i + 1}: invalid date "${date}"`);
        continue;
      }

      const routineId = templateMap.get(routine.toLowerCase());
      if (!routineId) {
        rejectedRows.push(`Row ${i + 1}: Routine "${routine}" not found — ignored`);
        continue;
      }

      const key = `${date}|${routineId}`;
      if (!logMap.has(key)) {
        logMap.set(key, {
          id: generateId(),
          schemaVersion: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          syncStatus: 'local_only',
          deviceId: 'local',
          date,
          routineId,
          exercises: [],
          notes: ''
        });
      }
      const log = logMap.get(key)!;

      let ejLog = log.exercises.find(e => e.name === exercise);
      if (!ejLog) {
        const tipoNorm = (type.toLowerCase() === 'fuerza' || type.toLowerCase() === 'strength') ? 'strength' : 'cardio';
        ejLog = {
          name: exercise,
          type: tipoNorm,
          sets: tipoNorm === 'strength' ? [] : undefined,
          cardio: tipoNorm === 'cardio' ? { distanceMeters: 0, timeMinutes: 0 } : undefined,
        };
        log.exercises.push(ejLog);
      }

      if (ejLog.type === 'strength') {
        const setNum = parseInt(col5, 10);
        const reps = parseInt(col6, 10);
        const weight = parseFloat(col7);
        if (isNaN(reps) || isNaN(weight) || reps < 0 || weight < 0) {
          errors.push(`Row ${i + 1}: invalid reps or weight`);
          continue;
        }
        ejLog.sets = ejLog.sets ?? [];
        ejLog.sets.push({ setNumber: setNum || ejLog.sets.length + 1, reps, weight });
      } else {
        ejLog.cardio = {
          distanceMeters: parseFloat(col5) || 0,
          timeMinutes: parseFloat(col6) || 0,
          technicalNotes: col7 || undefined,
        };
      }
    }

    for (const session of logMap.values()) {
      await this.workoutUseCases.updateWorkoutSession(session);
    }

    return {
      imported: logMap.size,
      rejected: rejectedRows.length,
      errors: [...errors, ...rejectedRows],
    };
  }

  async getAvailableMonths(): Promise<string[]> {
    const allWorkouts = await this.workoutUseCases.getAllWorkouts();
    const months = new Set<string>();
    allWorkouts.forEach(w => months.add(w.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }

  // ─── Validators ───

  private validateMonthlyArchive(data: any, context: string): string[] {
    const errors: string[] = [];
    const MAX_ERRORS = 20;

    if (!data || typeof data !== 'object') {
      errors.push(`${context}: must be a JSON object`);
      return errors;
    }

    const monthId = data.monthId || data.mesId;
    if (!monthId || typeof monthId !== 'string' || !/^\d{4}-\d{2}$/.test(monthId)) {
      errors.push(`${context}.monthId: invalid format (YYYY-MM expected)`);
    }

    if (!Array.isArray(data.logs)) {
      errors.push(`${context}.logs: must be an array`);
      return errors;
    }

    outer: for (let i = 0; i < data.logs.length; i++) {
      const log = data.logs[i];
      const logCtx = `${context}.logs[${i}]`;
      const date = log.date || log.fecha;

      if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`${logCtx}.date: invalid format (YYYY-MM-DD expected)`);
      }
      if (!(log.routineId || log.templateId) || typeof (log.routineId || log.templateId) !== 'string') {
        errors.push(`${logCtx}.routineId: required string`);
      }
      const exercises = log.exercises || log.ejercicios;
      if (!Array.isArray(exercises)) {
        errors.push(`${logCtx}.exercises: must be an array`);
        if (errors.length >= MAX_ERRORS) break;
        continue;
      }

      for (let j = 0; j < exercises.length; j++) {
        const ej = exercises[j];
        const ejCtx = `${logCtx}.exercises[${j}]`;
        const name = ej.name || ej.nombre;
        const type = ej.type || ej.tipo;

        if (!name || typeof name !== 'string') {
          errors.push(`${ejCtx}.name: required`);
        }
        if (type !== 'strength' && type !== 'cardio' && type !== 'fuerza') {
          errors.push(`${ejCtx}.type: must be 'strength' or 'cardio'`);
        }

        const sets = ej.sets || ej.series;
        if ((type === 'strength' || type === 'fuerza') && Array.isArray(sets)) {
          for (let k = 0; k < sets.length; k++) {
            const serie = sets[k];
            const sCtx = `${ejCtx}.sets[${k}]`;
            const weight = serie.weight ?? serie.peso;
            if (typeof serie.reps !== 'number' || serie.reps < 0) {
              errors.push(`${sCtx}.reps: must be >= 0`);
            }
            if (typeof weight !== 'number' || weight < 0) {
              errors.push(`${sCtx}.weight: must be >= 0`);
            }
            if (errors.length >= MAX_ERRORS) break outer;
          }
        }

        if (type === 'cardio' && ej.cardio) {
          const dist = ej.cardio.distanceMeters ?? ej.cardio.distanciaKm;
          const time = ej.cardio.timeMinutes ?? ej.cardio.tiempoMinutos;
          if (typeof dist !== 'number' || dist < 0) {
            errors.push(`${ejCtx}.cardio.distanceMeters: must be >= 0`);
          }
          if (typeof time !== 'number' || time < 0) {
            errors.push(`${ejCtx}.cardio.timeMinutes: must be >= 0`);
          }
        }

        if (errors.length >= MAX_ERRORS) break outer;
      }
    }

    return errors;
  }

  // ─── Helpers ───

  private async buildTemplateMap(): Promise<Map<string, string>> {
    const templates = await this.routineUseCases.getAllRoutines();
    return new Map(templates.map(t => [t.id, t.name]));
  }

  private logToCSVRows(log: WorkoutSession, templateName: string): string[] {
    const rows: string[] = [];
    for (const exercise of log.exercises) {
      if (exercise.type === 'strength' && exercise.sets) {
        for (const serie of exercise.sets) {
          rows.push(
            this.csvRow([
              log.date,
              templateName,
              exercise.name,
              'Strength',
              String(serie.setNumber),
              String(serie.reps),
              String(serie.weight),
            ])
          );
        }
      } else if (exercise.type === 'cardio' && exercise.cardio) {
        rows.push(
          this.csvRow([
            log.date,
            templateName,
            exercise.name,
            'Cardio',
            String(exercise.cardio.distanceMeters),
            String(exercise.cardio.timeMinutes),
            exercise.cardio.technicalNotes ?? '',
          ])
        );
      }
    }
    return rows;
  }

  /**
   * Split CSV text into logical rows, respecting quoted fields that may contain newlines.
   */
  private splitCSVLines(text: string): string[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && text[i + 1] === '\n') i++; // Skip \r\n
        if (current.trim()) lines.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) lines.push(current);
    return lines;
  }

  private parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private csvRow(fields: string[]): string {
    return fields
      .map((f) => {
        const escaped = f.replace(/"/g, '""');
        return f.includes(',') || f.includes('"') || f.includes('\n')
          ? `"${escaped}"`
          : escaped;
      })
      .join(',');
  }

  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
