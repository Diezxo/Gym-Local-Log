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
   * Importa un archivo JSON como ArchivoMensual
   */
  async importJSON(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result as string) as ArchivoMensual;

          // Validaciones básicas
          if (!data.mesId || !data.logs || !Array.isArray(data.logs)) {
            throw new Error('Formato de archivo inválido');
          }

          await this.db.importMonthlyArchive(data);
          resolve(data.mesId);
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
