import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { MonthlyArchive, DailyLog, ExerciseLog } from '../models/interfaces';

// ─── Import Result ───
export interface ImportResult {
  imported: number;   // number of monthly archives imported
  rejected: number;   // number of rows/logs rejected
  errors: string[];   // human-readable error messages
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private db: DbService) {}

  /**
   * Export monthly archive as JSON
   */
  async exportJSON(monthId: string): Promise<void> {
    const archive = await this.db.getMonthlyArchive(monthId);
    if (!archive) {
      throw new Error(`No data for month ${monthId}`);
    }

    const json = JSON.stringify(archive, null, 2);
    this.downloadFile(json, `${monthId}.json`, 'application/json');
  }

  /**
   * Export all months as a single JSON
   */
  async exportAllJSON(): Promise<void> {
    const archives = await this.db.getAllMonthlyArchives();
    if (!archives || archives.length === 0) {
      throw new Error('No data to export');
    }

    const json = JSON.stringify(archives, null, 2);
    this.downloadFile(json, `gym_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  /**
   * Export monthly archive as CSV
   */
  async exportCSV(monthId: string): Promise<void> {
    const archive = await this.db.getMonthlyArchive(monthId);
    if (!archive) {
      throw new Error(`No data for month ${monthId}`);
    }

    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Date,Routine,Exercise,Type,Set/Distance_m,Reps/Time_min,Weight_kg/Notes');

    for (const log of archive.logs) {
      const templateName = templateMap.get(log.templateId) ?? log.templateId;
      rows.push(...this.logToCSVRows(log, templateName));
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `${monthId}.csv`, 'text/csv');
  }

  /**
   * Export all months as CSV
   */
  async exportAllCSV(): Promise<void> {
    const archives = await this.db.getAllMonthlyArchives();
    if (!archives || archives.length === 0) {
      throw new Error('No data to export');
    }

    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Date,Routine,Exercise,Type,Set/Distance_m,Reps/Time_min,Weight_kg/Notes');

    for (const archive of archives) {
      for (const log of archive.logs) {
        const templateName = templateMap.get(log.templateId) ?? log.templateId;
        rows.push(...this.logToCSVRows(log, templateName));
      }
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `gym_backup_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  /**
   * Import JSON (Strict validation)
   */
  async importJSON(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          let data: any;
          try {
            data = JSON.parse(reader.result as string);
          } catch {
            reject(new Error('Invalid JSON file'));
            return;
          }

          if (Array.isArray(data)) {
            const allErrors: string[] = [];
            for (let i = 0; i < data.length; i++) {
              const errs = this.validateMonthlyArchive(data[i], `array[${i}]`);
              allErrors.push(...errs);
            }
            if (allErrors.length > 0) {
              reject(new Error(`Validation errors (${allErrors.length}):\n• ${allErrors.slice(0, 10).join('\n• ')}`));
              return;
            }
            for (const monthData of data) {
              await this.db.importMonthlyArchive(monthData);
            }
            resolve('all');
          } else {
            const errs = this.validateMonthlyArchive(data, 'root');
            if (errs.length > 0) {
              reject(new Error(`Validation errors (${errs.length}):\n• ${errs.slice(0, 10).join('\n• ')}`));
              return;
            }
            await this.db.importMonthlyArchive(data);
            resolve(data.monthId || data.mesId);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  /**
   * Import CSV
   */
  async importCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = reader.result as string;
          const lines = text.split(/\r?\n/).filter(l => l.trim());

          if (lines.length < 2) {
            reject(new Error('CSV is empty or only has headers'));
            return;
          }

          const header = lines[0].toLowerCase();
          // Backward compatibility: accept 'fecha' and 'rutina' or 'date' and 'routine'
          if (!(header.includes('fecha') || header.includes('date')) || !(header.includes('rutina') || header.includes('routine'))) {
            reject(new Error('Invalid CSV format: missing Date/Routine columns'));
            return;
          }

          const templates = await this.db.getTemplates();
          const templateMap = new Map(templates.map(t => [t.name.trim().toLowerCase(), t.id]));

          const errors: string[] = [];
          const rejectedRows: string[] = [];
          const logMap = new Map<string, DailyLog>();

          for (let i = 1; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            if (row.length < 4) continue;

            const [date, routine, exercise, type, col5 = '', col6 = '', col7 = ''] = row.map(s => s.trim());

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              errors.push(`Row ${i + 1}: invalid date "${date}"`);
              continue;
            }

            const templateId = templateMap.get(routine.toLowerCase());
            if (!templateId) {
              rejectedRows.push(`Row ${i + 1}: Routine "${routine}" not found — ignored`);
              continue;
            }

            const key = `${date}|${templateId}`;
            if (!logMap.has(key)) {
              logMap.set(key, { date, templateId, exercises: [], notes: '' });
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

          const monthArchives = new Map<string, MonthlyArchive>();
          for (const log of logMap.values()) {
            const monthId = log.date.substring(0, 7);
            if (!monthArchives.has(monthId)) {
              monthArchives.set(monthId, { monthId, schemaVersion: 2, logs: [] });
            }
            monthArchives.get(monthId)!.logs.push(log);
          }

          for (const archive of monthArchives.values()) {
            await this.db.importMonthlyArchive(archive);
          }

          resolve({
            imported: logMap.size,
            rejected: rejectedRows.length,
            errors: [...errors, ...rejectedRows],
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error reading CSV'));
      reader.readAsText(file);
    });
  }

  async getAvailableMonths(): Promise<string[]> {
    const archives = await this.db.getAllMonthlyArchives();
    return archives
      .map((a) => a.monthId)
      .sort()
      .reverse();
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
      if (!log.templateId || typeof log.templateId !== 'string') {
        errors.push(`${logCtx}.templateId: required string`);
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
    const templates = await this.db.getTemplates();
    return new Map(templates.map(t => [t.id, t.name]));
  }

  private logToCSVRows(log: DailyLog, templateName: string): string[] {
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
