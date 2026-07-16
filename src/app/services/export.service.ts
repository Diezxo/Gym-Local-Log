import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { ArchivoMensual, LogDiario, EjercicioLog } from '../models/interfaces';

// ─── Import Result ───
export interface ImportResult {
  imported: number;   // number of monthly archives imported
  rejected: number;   // number of rows/logs rejected
  errors: string[];   // human-readable error messages
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private db = inject(DbService);

  /**
   * Exporta el archivo mensual como JSON y lo descarga
   */
  async exportJSON(mesId: string): Promise<void> {
    const archive = await this.db.getMonthlyArchive(mesId);
    if (!archive) {
      throw new Error(`No hay datos para el mes ${mesId}`);
    }

    const json = JSON.stringify(archive, null, 2);
    this.downloadFile(json, `${mesId}.json`, 'application/json');
  }

  /**
   * Exporta todos los meses disponibles como un único JSON
   */
  async exportAllJSON(): Promise<void> {
    const archives = await this.db.getAllMonthlyArchives();
    if (!archives || archives.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const json = JSON.stringify(archives, null, 2);
    this.downloadFile(json, `gym_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  /**
   * Exporta el archivo mensual como CSV aplanado
   * Columnas: Fecha, Rutina, Ejercicio, Tipo, Serie/Distancia, Reps/Tiempo, Peso/Notas
   */
  async exportCSV(mesId: string): Promise<void> {
    const archive = await this.db.getMonthlyArchive(mesId);
    if (!archive) {
      throw new Error(`No hay datos para el mes ${mesId}`);
    }

    // Pre-load template names to avoid N+1 queries
    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas');

    for (const log of archive.logs) {
      const templateName = templateMap.get(log.templateId) ?? log.templateId;
      rows.push(...this.logToCSVRows(log, templateName));
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `${mesId}.csv`, 'text/csv');
  }

  /**
   * Exporta todos los meses disponibles como un único CSV aplanado
   */
  async exportAllCSV(): Promise<void> {
    const archives = await this.db.getAllMonthlyArchives();
    if (!archives || archives.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const templateMap = await this.buildTemplateMap();
    const rows: string[] = [];
    rows.push('Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas');

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
   * Importa un archivo JSON como ArchivoMensual con validación estricta.
   * Reporta todos los errores encontrados antes de rechazar.
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
            reject(new Error('El archivo no es JSON válido'));
            return;
          }

          if (Array.isArray(data)) {
            // Import multiple months
            const allErrors: string[] = [];
            for (let i = 0; i < data.length; i++) {
              const errs = this.validateArchivoMensual(data[i], `mes[${i}]`);
              allErrors.push(...errs);
            }
            if (allErrors.length > 0) {
              reject(new Error(`Errores de validación (${allErrors.length}):\n• ${allErrors.slice(0, 10).join('\n• ')}`));
              return;
            }
            for (const monthData of data) {
              await this.db.importMonthlyArchive(monthData);
            }
            resolve('all');
          } else {
            // Import single month
            const errs = this.validateArchivoMensual(data, 'raíz');
            if (errs.length > 0) {
              reject(new Error(`Errores de validación (${errs.length}):\n• ${errs.slice(0, 10).join('\n• ')}`));
              return;
            }
            await this.db.importMonthlyArchive(data as ArchivoMensual);
            resolve(data.mesId);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsText(file);
    });
  }

  /**
   * Importa un archivo CSV como logs mensuales.
   * Las filas cuya "Rutina" no coincida con ningún template existente son rechazadas.
   */
  async importCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = reader.result as string;
          const lines = text.split(/\r?\n/).filter(l => l.trim());

          if (lines.length < 2) {
            reject(new Error('El archivo CSV está vacío o solo tiene encabezados'));
            return;
          }

          // Validate header
          const header = lines[0].toLowerCase();
          if (!header.includes('fecha') || !header.includes('rutina')) {
            reject(new Error('Formato CSV inválido: faltan columnas "Fecha" o "Rutina" en el encabezado'));
            return;
          }

          // Pre-load templates to build name→id map
          const templates = await this.db.getTemplates();
          const templateMap = new Map(templates.map(t => [t.nombre.trim().toLowerCase(), t.id]));

          const errors: string[] = [];
          const rejectedRows: string[] = [];

          // Group parsed rows by fecha+templateId
          const logMap = new Map<string, LogDiario>();

          for (let i = 1; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            if (row.length < 4) continue;

            const [fecha, rutina, ejercicio, tipo, col5 = '', col6 = '', col7 = ''] = row.map(s => s.trim());

            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
              errors.push(`Fila ${i + 1}: fecha "${fecha}" con formato inválido (esperado YYYY-MM-DD)`);
              continue;
            }

            // Validate template exists (reject if not found)
            const templateId = templateMap.get(rutina.toLowerCase());
            if (!templateId) {
              rejectedRows.push(`Fila ${i + 1}: Rutina "${rutina}" no encontrada — fila ignorada`);
              continue;
            }

            const key = `${fecha}|${templateId}`;
            if (!logMap.has(key)) {
              logMap.set(key, { fecha, templateId, ejercicios: [], notas: '' });
            }
            const log = logMap.get(key)!;

            // Find or create ejercicio entry
            let ejLog = log.ejercicios.find(e => e.nombre === ejercicio);
            if (!ejLog) {
              const tipoNorm = tipo.toLowerCase() === 'fuerza' ? 'fuerza' : 'cardio';
              ejLog = {
                nombre: ejercicio,
                tipo: tipoNorm,
                series: tipoNorm === 'fuerza' ? [] : undefined,
                cardio: tipoNorm === 'cardio' ? { distanciaKm: 0, tiempoMinutos: 0 } : undefined,
              };
              log.ejercicios.push(ejLog);
            }

            if (tipo.toLowerCase() === 'fuerza') {
              const serieNum = parseInt(col5, 10);
              const reps = parseInt(col6, 10);
              const peso = parseFloat(col7);
              if (isNaN(reps) || isNaN(peso) || reps < 0 || peso < 0) {
                errors.push(`Fila ${i + 1}: reps o peso inválidos`);
                continue;
              }
              ejLog.series = ejLog.series ?? [];
              ejLog.series.push({ numero: serieNum || ejLog.series.length + 1, reps, peso });
            } else {
              ejLog.cardio = {
                distanciaKm: parseFloat(col5) || 0,
                tiempoMinutos: parseFloat(col6) || 0,
                notasTecnica: col7 || undefined,
              };
            }
          }

          // Group logs into monthly archives and import
          const monthArchives = new Map<string, ArchivoMensual>();
          for (const log of logMap.values()) {
            const mesId = log.fecha.substring(0, 7);
            if (!monthArchives.has(mesId)) {
              monthArchives.set(mesId, { mesId, schemaVersion: 1, logs: [] });
            }
            monthArchives.get(mesId)!.logs.push(log);
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
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsText(file);
    });
  }

  /**
   * Retorna la lista de meses disponibles en la base de datos
   */
  async getAvailableMonths(): Promise<string[]> {
    const archives = await this.db.getAllMonthlyArchives();
    return archives
      .map((a) => a.mesId)
      .sort()
      .reverse();
  }

  // ─── Validators ───

  /**
   * Validates an ArchivoMensual object deeply, returning an array of error messages.
   * Returns empty array if valid.
   */
  private validateArchivoMensual(data: any, context: string): string[] {
    const errors: string[] = [];
    const MAX_ERRORS = 20;

    if (!data || typeof data !== 'object') {
      errors.push(`${context}: debe ser un objeto JSON`);
      return errors;
    }

    if (!data.mesId || typeof data.mesId !== 'string' || !/^\d{4}-\d{2}$/.test(data.mesId)) {
      errors.push(`${context}.mesId: formato inválido (esperado YYYY-MM)`);
    }

    if (!Array.isArray(data.logs)) {
      errors.push(`${context}.logs: debe ser un array`);
      return errors;
    }

    outer: for (let i = 0; i < data.logs.length; i++) {
      const log = data.logs[i];
      const logCtx = `${context}.logs[${i}]`;

      if (!log.fecha || typeof log.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(log.fecha)) {
        errors.push(`${logCtx}.fecha: formato inválido (esperado YYYY-MM-DD)`);
      }
      if (!log.templateId || typeof log.templateId !== 'string') {
        errors.push(`${logCtx}.templateId: requerido (string)`);
      }
      if (!Array.isArray(log.ejercicios)) {
        errors.push(`${logCtx}.ejercicios: debe ser un array`);
        if (errors.length >= MAX_ERRORS) break;
        continue;
      }

      for (let j = 0; j < log.ejercicios.length; j++) {
        const ej = log.ejercicios[j];
        const ejCtx = `${logCtx}.ejercicios[${j}]`;

        if (!ej.nombre || typeof ej.nombre !== 'string') {
          errors.push(`${ejCtx}.nombre: requerido`);
        }
        if (ej.tipo !== 'fuerza' && ej.tipo !== 'cardio') {
          errors.push(`${ejCtx}.tipo: debe ser 'fuerza' o 'cardio', encontrado "${ej.tipo}"`);
        }

        if (ej.tipo === 'fuerza' && Array.isArray(ej.series)) {
          for (let k = 0; k < ej.series.length; k++) {
            const serie = ej.series[k];
            const sCtx = `${ejCtx}.series[${k}]`;
            if (typeof serie.reps !== 'number' || serie.reps < 0) {
              errors.push(`${sCtx}.reps: debe ser número ≥ 0`);
            }
            if (typeof serie.peso !== 'number' || serie.peso < 0) {
              errors.push(`${sCtx}.peso: debe ser número ≥ 0`);
            }
            if (errors.length >= MAX_ERRORS) break outer;
          }
        }

        if (ej.tipo === 'cardio' && ej.cardio) {
          if (typeof ej.cardio.distanciaKm !== 'number' || ej.cardio.distanciaKm < 0) {
            errors.push(`${ejCtx}.cardio.distanciaKm: debe ser número ≥ 0`);
          }
          if (typeof ej.cardio.tiempoMinutos !== 'number' || ej.cardio.tiempoMinutos < 0) {
            errors.push(`${ejCtx}.cardio.tiempoMinutos: debe ser número ≥ 0`);
          }
        }

        if (errors.length >= MAX_ERRORS) break outer;
      }
    }

    return errors;
  }

  // ─── Helpers ───

  /** Builds a map of templateId → templateName for CSV export (avoids N+1 queries) */
  private async buildTemplateMap(): Promise<Map<string, string>> {
    const templates = await this.db.getTemplates();
    return new Map(templates.map(t => [t.id, t.nombre]));
  }

  /** Converts a LogDiario to CSV rows */
  private logToCSVRows(log: LogDiario, templateName: string): string[] {
    const rows: string[] = [];
    for (const ejercicio of log.ejercicios) {
      if (ejercicio.tipo === 'fuerza' && ejercicio.series) {
        for (const serie of ejercicio.series) {
          rows.push(
            this.csvRow([
              log.fecha,
              templateName,
              ejercicio.nombre,
              'Fuerza',
              String(serie.numero),
              String(serie.reps),
              String(serie.peso),
            ])
          );
        }
      } else if (ejercicio.tipo === 'cardio' && ejercicio.cardio) {
        rows.push(
          this.csvRow([
            log.fecha,
            templateName,
            ejercicio.nombre,
            'Cardio',
            String(ejercicio.cardio.distanciaKm),
            String(ejercicio.cardio.tiempoMinutos),
            ejercicio.cardio.notasTecnica ?? '',
          ])
        );
      }
    }
    return rows;
  }

  /** Parses a single CSV line, handling quoted fields with escaped double-quotes */
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
