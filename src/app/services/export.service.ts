import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { ArchivoMensual, LogDiario, EjercicioLog } from '../models/interfaces';

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

    const rows: string[] = [];
    rows.push('Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas');

    for (const log of archive.logs) {
      const templateName = await this.getTemplateName(log.templateId);

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

    const rows: string[] = [];
    rows.push('Fecha,Rutina,Ejercicio,Tipo,Serie/Distancia,Reps/Tiempo,Peso/Notas');

    for (const archive of archives) {
      for (const log of archive.logs) {
        const templateName = await this.getTemplateName(log.templateId);

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
      }
    }

    const csv = rows.join('\n');
    this.downloadFile(csv, `gym_backup_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  /**
   * Importa un archivo JSON como ArchivoMensual
   */
  async importJSON(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result as string);

          if (Array.isArray(data)) {
            // Import multiple months
            for (const monthData of data) {
              if (!monthData.mesId || !monthData.logs || !Array.isArray(monthData.logs)) {
                throw new Error('Formato de archivo inválido en uno de los meses');
              }
              await this.db.importMonthlyArchive(monthData);
            }
            resolve('all');
          } else {
            // Import single month
            if (!data.mesId || !data.logs || !Array.isArray(data.logs)) {
              throw new Error('Formato de archivo inválido');
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
   * Retorna la lista de meses disponibles en la base de datos
   */
  async getAvailableMonths(): Promise<string[]> {
    const archives = await this.db.getAllMonthlyArchives();
    return archives
      .map((a) => a.mesId)
      .sort()
      .reverse();
  }

  // ─── Helpers ───

  private async getTemplateName(templateId: string): Promise<string> {
    const template = await this.db.getTemplate(templateId);
    return template?.nombre ?? templateId;
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
