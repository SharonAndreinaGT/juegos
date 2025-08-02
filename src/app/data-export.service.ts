import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root'
})
export class DataExportService {
  private directusUrl = 'http://localhost:8055'; // URL de nuestro Directus

  constructor(private http: HttpClient) {}

  /**
   * Exporta todas las colecciones en un archivo ZIP
   */
  exportAllCollectionsAsZIP() {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Definir las colecciones a exportar
    const collections = [
      { name: 'users', fields: ['id', 'name', 'lastname', 'section', 'grade', 'score'] },
      { name: 'puzzle', fields: ['id', 'level_name', 'imageUrl', 'rows', 'cols', 'time_limit', 'isActive'] },
      { name: 'memory', fields: ['id', 'level_name', 'card_count', 'time_limit', 'intent', 'isActive', 'images'] },
      { name: 'riddle', fields: ['id', 'level_number', 'level_name', 'max_intents', 'words_level', 'words', 'isActive', 'time_limit'] },
      { name: 'puzzle_results', fields: ['id', 'student_id', 'level_name', 'score', 'time',  'created_at'] },
      { name: 'memory_results', fields: ['id', 'level_id', 'score', 'elapsedTime', 'matchedPairs', 'totalPairs', 'intentRemaining', 'completed', 'student_id', 'created_at'] },
      { name: 'riddle_results', fields: ['id', 'level_name', 'score', 'attempts_made', 'words_guessed', 'time_taken', 'is_complete', 'student_id'] }
    ];

    let completedExports = 0;
    const totalExports = collections.length;

    collections.forEach(collection => {
      this.exportCollectionToZip(zip, collection.name, collection.fields, timestamp)
        .then(() => {
          completedExports++;
          if (completedExports === totalExports) {
            this.generateAndDownloadZIP(zip, timestamp);
          }
        })
        .catch(error => {
          console.error(`Error exportando ${collection.name}:`, error);
          completedExports++;
          if (completedExports === totalExports) {
            this.generateAndDownloadZIP(zip, timestamp);
          }
        });
    });
  }

  /**
   * Exporta una colección específica al ZIP
   */
  private async exportCollectionToZip(zip: JSZip, collection: string, fields: string[], timestamp: string): Promise<void> {
    try {
      const url = `${this.directusUrl}/items/${collection}`;
      const params = new HttpParams().set('fields', fields.join(','));
      
      const response = await this.http.get<any>(url, { params }).toPromise();
      
      if (response && response.data && response.data.length > 0) {
        const csvData = this.convertToCSV(response.data, fields);
        const fileName = `${collection}_${timestamp}.csv`;
        zip.file(fileName, csvData);
        console.log(`Colección ${collection} exportada exitosamente`);
      } else {
        console.warn(`No hay datos en la colección ${collection}`);
        // Crear archivo CSV vacío con headers
        const csvData = this.convertToCSV([], fields);
        const fileName = `${collection}_${timestamp}.csv`;
        zip.file(fileName, csvData);
      }
    } catch (error) {
      console.error(`Error al exportar ${collection}:`, error);
      // Crear archivo CSV con error
      const errorData = `Error al exportar ${collection}: ${error}\n`;
      const fileName = `${collection}_${timestamp}_error.csv`;
      zip.file(fileName, errorData);
    }
  }

  /**
   * Genera y descarga el archivo ZIP
   */
  private async generateAndDownloadZIP(zip: JSZip, timestamp: string): Promise<void> {
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `backup_completo_${timestamp}.zip`;
      saveAs(content, fileName);
      console.log('Archivo ZIP generado y descargado exitosamente');
    } catch (error) {
      console.error('Error al generar ZIP:', error);
    }
  }

  /**
   * Exporta una colección como CSV (método original mantenido para compatibilidad)
   * @param collection Nombre de la colección (ej: 'users', 'teachers')
   * @param fields Campos específicos a exportar (opcional)
   * @param gradeFilter Filtro por grado (opcional)
   */
  exportCollectionAsCSV(collection: string, fields: string[] = [], gradeFilter?: string) {
    let url = `${this.directusUrl}/items/${collection}`;
    let params = new HttpParams();

    // Agregar campos específicos si se proporcionan
    if (fields.length > 0) {
      params = params.set('fields', fields.join(','));
    }

    // Agregar filtro por grado si se proporciona
    if (gradeFilter) {
      params = params.set('filter[grade][_eq]', gradeFilter);
    }

    this.http.get<any>(url, { params })
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const csvData = this.convertToCSV(response.data, fields);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const fileName = gradeFilter ? `${collection}_${gradeFilter}.csv` : `${collection}.csv`;
            saveAs(blob, fileName);
          } else {
            console.warn('No hay datos para exportar');
          }
        },
        error: (error) => {
          console.error('Error al exportar datos:', error);
        }
      });
  }

  /**
   * Exporta estudiantes por grado
   * @param grade Grado a exportar ('first', 'second', 'third')
   */
  exportStudentsByGrade(grade: string) {
    const fields = ['id', 'name', 'lastname', 'section', 'grade', 'score'];
    this.exportCollectionAsCSV('users', fields, grade);
  }

  /**
   * Exporta todos los estudiantes
   */
  exportAllStudents() {
    const fields = ['id', 'name', 'lastname', 'section', 'grade', 'score'];
    this.exportCollectionAsCSV('users', fields);
  }

  /**
   * Exporta configuraciones de puzzle
   */
  exportPuzzleConfigs() {
    const fields = ['id', 'level_name', 'imageUrl', 'rows', 'cols', 'time_limit', 'isActive'];
    this.exportCollectionAsCSV('puzzle', fields);
  }

  /**
   * Exporta configuraciones de memory
   */
  exportMemoryConfigs() {
    const fields = ['id', 'level_name', 'card_count', 'time_limit', 'intent', 'isActive', 'images'];
    this.exportCollectionAsCSV('memory', fields);
  }

  /**
   * Exporta configuraciones de riddle
   */
  exportRiddleConfigs() {
    const fields = ['id', 'level_number', 'level_name', 'max_intents', 'words_level', 'words', 'isActive', 'time_limit'];
    this.exportCollectionAsCSV('riddle', fields);
  }

  /**
   * Exporta resultados de puzzle
   */
  exportPuzzleResults() {
    const fields = ['id', 'student_id', 'level_name', 'score', 'stars', 'moves', 'time', 'is_complete', 'date_created'];
    this.exportCollectionAsCSV('puzzle_results', fields);
  }

  /**
   * Exporta resultados de memory
   */
  exportMemoryResults() {
    const fields = ['id', 'level_id', 'level_name', 'score', 'stars', 'elapsedTime', 'matchedPairs', 'totalPairs', 'intentRemaining', 'completed', 'student_id'];
    this.exportCollectionAsCSV('memory_results', fields);
  }

  /**
   * Exporta resultados de riddle
   */
  exportRiddleResults() {
    const fields = ['id', 'level_name', 'score', 'attempts_made', 'words_guessed', 'time_taken', 'is_complete', 'student_id'];
    this.exportCollectionAsCSV('riddle_results', fields);
  }

  /**
   * Convierte datos a formato CSV
   * @param data Array de objetos
   * @param fields Campos específicos a incluir
   * @returns String en formato CSV
   */
  private convertToCSV(data: any[], fields: string[]): string {
    if (data.length === 0) {
      // Si no hay datos, crear CSV con solo headers
      const header = fields.length > 0 ? fields : ['id'];
      return header.join(',') + '\r\n';
    }

    const replacer = (key: string, value: any) => {
      if (value === null || value === undefined) return '';
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    };

    const header = fields.length > 0 ? fields : Object.keys(data[0]);
    
    const csv = [
      header.join(','), // encabezados
      ...data.map(row => 
        header.map(fieldName => 
          replacer(fieldName, row[fieldName])
        ).join(',')
      )
    ].join('\r\n');
    
    return csv;
  }
} 