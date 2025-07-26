import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { MemoryService } from '../memory.service';
import { RiddleService } from '../riddle.service';
import { AuthService } from '../auth.service';

import { User } from '../puzzle-config.model';
import { PuzzleResult } from '../puzzle-config.model';
import { MemoryResult } from '../memory-config-model';
import { RiddleResult } from '../riddle.model';

import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

interface StudentProgress {
  id: string;
  name: string;
  lastname: string;
  grade?: string;
  latestPuzzleResult: PuzzleResult | null;
}

interface MemoryStudentDisplay {
  id: string;
  name: string;
  lastname: string;
  grade?: string;
  level_name: string | null;
  score: number;
  elapsedTime: number;
  totalPairs: number;
}

interface RiddleStudentDisplay {
  id: string;
  name: string;
  lastname: string;
  grade?: string;
  level_name: string | null;
  score: number;
  time_taken: number;
  words_guessed: number;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'lastname', 'grade', 'level_name', 'score', 'time'];
  displayedMemoryColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_name',
    'score',
    'elapsedTime',
    'totalPairs',
  ];
  displayedRiddleColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_name',
    'score',
    'time_taken',
    'words_guessed',
  ];

  studentProgressData = new MatTableDataSource<StudentProgress>([]);
  memoryResultsData = new MatTableDataSource<MemoryStudentDisplay>([]);
  riddleResultsData = new MatTableDataSource<RiddleStudentDisplay>([]);

  loading = true;
  loadingMemoryResults = true;
  loadingRiddleResults = true;
  error: string | null = null;
  errorMemoryResults: string | null = null;
  errorRiddleResults: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('memoryPaginator') memoryPaginator!: MatPaginator;
  @ViewChild('riddlePaginator') riddlePaginator!: MatPaginator;


  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService,
    private memoryService: MemoryService,
    private riddleService: RiddleService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAllStudentsProgress();
    this.loadAllStudentsMemoryResults();
    this.loadAllStudentsRiddleResults();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.studentProgressData.paginator = this.paginator;
      }
      if (this.memoryPaginator) {
        this.memoryResultsData.paginator = this.memoryPaginator;
      }

      if (this.riddlePaginator) {
        this.riddleResultsData.paginator = this.riddlePaginator;
      }
    });
  }


  loadAllStudentsProgress(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loading = false;
          this.error = 'No se encontraron estudiantes.';
          return of([]);
        }

        const progressObservables = users.map(user => {
          return this.puzzleService.getStudentPuzzleResults(user.id).pipe(
            map(results => {
              const latestResult = results && results.length > 0 ? results[0] : null;
              return {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                grade: user.grade,
                latestPuzzleResult: latestResult,
              } as StudentProgress;
            }),
            catchError(err => {
              console.error(`Error al obtener resultados de rompecabezas para el estudiante ${user.name} (ID: ${user.id}):`, err);
              return of({
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                grade: user.grade,
                latestPuzzleResult: null,
              } as StudentProgress);
            })
          );
        });

        return forkJoin(progressObservables);
      }),
      catchError(err => {
        console.error('Error al cargar el progreso de todos los estudiantes (rompecabezas):', err);
        this.error = 'Error al cargar el progreso general de los estudiantes (rompecabezas). Por favor, inténtalo de nuevo.';
        this.loading = false;
        return of([]);
      })
    ).subscribe(
      (progressData: StudentProgress[]) => {
        this.studentProgressData.data = progressData;
        this.loading = false;
        console.log('[ProgressComponent] Progreso de estudiantes (rompecabezas) cargado:', this.studentProgressData.data);
      },
      () => {
        this.loading = false;
      }
    );
  }

  loadAllStudentsMemoryResults(): void {
    this.loadingMemoryResults = true;
    this.errorMemoryResults = null;

    this.userService.getUsers().pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loadingMemoryResults = false;
          this.errorMemoryResults = 'No se encontraron estudiantes para los resultados de memoria.';
          return of([]);
        }

        const memoryResultsObservables = users.map(user => {
          return this.memoryService.getStudentMemoryResults(user.id).pipe(
            map(results => {
              const latestMemoryResult = results && results.length > 0 ? results[0] : null;

              if (latestMemoryResult) {
                return {
                  id: user.id,
                  name: user.name,
                  lastname: user.lastname,
                  grade: user.grade,
                  level_name: latestMemoryResult.level_name,
                  score: latestMemoryResult.score,
                  elapsedTime: latestMemoryResult.elapsedTime,
                  totalPairs: latestMemoryResult.totalPairs,
                  intentRemaining: latestMemoryResult.intentRemaining,
                } as MemoryStudentDisplay;
              } else {
                return {
                  id: user.id,
                  name: user.name,
                  lastname: user.lastname,
                  grade: user.grade,
                  level_name: null,
                  score: 0,
                  elapsedTime: 0,
                  totalPairs: 0,
                  intentRemaining: 0,
                } as MemoryStudentDisplay;
              }
            }),
            catchError(err => {
              console.error(`Error al obtener resultados de memoria para el estudiante ${user.name} (ID: ${user.id}):`, err);
              return of({
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                grade: user.grade,
                level_name: null,
                score: 0,
                elapsedTime: 0,
                totalPairs: 0,
                intentRemaining: 0,
              } as MemoryStudentDisplay);
            })
          );
        });

        return forkJoin(memoryResultsObservables);
      }),
      catchError(err => {
        console.error('Error al cargar los resultados de memoria de todos los estudiantes:', err);
        this.errorMemoryResults = 'Error al cargar los resultados de memoria de los estudiantes. Por favor, inténtalo de nuevo.';
        this.loadingMemoryResults = false;
        return of([]);
      })
    ).subscribe(
      (memoryData: MemoryStudentDisplay[]) => {
        this.memoryResultsData.data = memoryData;
        this.loadingMemoryResults = false;
        console.log('[ProgressComponent] Resultados de memoria de estudiantes cargados:', this.memoryResultsData.data);
      },
      () => {
        this.loadingMemoryResults = false;
      }
    );
  }

  loadAllStudentsRiddleResults(): void {
    this.loadingRiddleResults = true;
    this.errorRiddleResults = null;

    this.userService.getUsers().pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loadingRiddleResults = false;
          this.errorRiddleResults = 'No se encontraron estudiantes para los resultados de "Adivina la Palabra Oculta".';
          return of([]);
        }

        const riddleResultsObservables = users.map(user => {
          return this.riddleService.getStudentRiddleResults(user.id).pipe(
            map(results => {
              const latestRiddleResult = results && results.length > 0 ? results[0] : null;

              if (latestRiddleResult) {
                return {
                  id: user.id,
                  name: user.name,
                  lastname: user.lastname,
                  grade: user.grade,
                  level_name: latestRiddleResult.level_name,
                  score: latestRiddleResult.score,
                  time_taken: latestRiddleResult.time_taken,
                  words_guessed: latestRiddleResult.words_guessed,
                } as RiddleStudentDisplay;
              } else {
                return {
                  id: user.id,
                  name: user.name,
                  lastname: user.lastname,
                  grade: user.grade,
                  level_name: null,
                  score: 0,
                  time_taken: 0,
                  words_guessed: 0,
                } as RiddleStudentDisplay;
              }
            }),
            catchError(err => {
              console.error(`Error al obtener resultados de Riddle para el estudiante ${user.name} (ID: ${user.id}):`, err);
              return of({
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                grade: user.grade,
                level_name: null,
                score: 0,
                time_taken: 0,
                words_guessed: 0,
              } as RiddleStudentDisplay);
            })
          );
        });

        return forkJoin(riddleResultsObservables);
      }),
      catchError(err => {
        console.error('Error al cargar los resultados de Riddle de todos los estudiantes:', err);
        this.errorRiddleResults = 'Error al cargar los resultados de "Adivina la Palabra Oculta" de los estudiantes. Por favor, inténtalo de nuevo.';
        this.loadingRiddleResults = false;
        return of([]);
      })
    ).subscribe(
      (riddleData: RiddleStudentDisplay[]) => {
        this.riddleResultsData.data = riddleData;
        this.loadingRiddleResults = false;
        console.log('[ProgressComponent] Resultados de Riddle de estudiantes cargados:', this.riddleResultsData.data);
      },
      () => {
        this.loadingRiddleResults = false;
      }
    );
  }

  viewStudentHistory(studentId: string): void {
    this.router.navigate(['/student-progress', studentId, 'puzzle']);
  }

  navigateTo(view: string): void {
    this.router.navigate([view]);
  }

  /**
   * Genera un reporte PDF con los progresos de Rompecabezas, Memoria y Adivina la Palabra Oculta.
   */
  generateReportPdf(): void {
    const doc = new jsPDF();
    let yOffset = 10; // Posición inicial para el contenido en la página

    // --- Título del Reporte (en la primera página) ---
    doc.setFontSize(18);
    doc.text('Reporte de Progreso General de Estudiantes', 14, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, yOffset);
    yOffset += 20;

    // --- Sección de ROMPECABEZAS ---
    doc.setFontSize(16);
    doc.text('1. Progreso de Rompecabezas', 14, yOffset);
    yOffset += 10;

    const puzzleHeaders = [['Nombre', 'Apellido', 'Grado', 'Nivel', 'Puntaje', 'Tiempo (segundos)']];
    const puzzleData = this.studentProgressData.data.map(student => [
      student.name,
      student.lastname,
      student.grade === 'first' ? 'Primer grado' : student.grade === 'second' ? 'Segundo grado' : student.grade === 'third' ? 'Tercer grado' : 'No definido',
      student.latestPuzzleResult?.level_name ?? '0',
      (student.latestPuzzleResult?.score ?? '0').toString(),
      (student.latestPuzzleResult?.time ?? '0').toString()
    ]);

    autoTable(doc, {
      head: puzzleHeaders,
      body: puzzleData,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 }
      },
      didDrawPage: (data) => {
        // Si la tabla de rompecabezas se extiende a una nueva página,
        // puedes agregar encabezados o pie de página específicos aquí.
      }
    });

    // --- Sección de MEMORIA ---
    // Añadir una nueva página antes de dibujar la sección de memoria
    doc.addPage();
    yOffset = 10; // Reiniciar yOffset para la nueva página

    doc.setFontSize(16);
    doc.text('2. Progreso de Memoria', 14, yOffset);
    yOffset += 10;

    const memoryHeaders = [['Nombre', 'Apellido', 'Grado', 'Nivel', 'Puntaje', 'Tiempo (segundos)', 'Total Pares']];
    const memoryData = this.memoryResultsData.data.map(result => [
      result.name,
      result.lastname,
      result.grade === 'first' ? 'Primer grado' : result.grade === 'second' ? 'Segundo grado' : result.grade === 'third' ? 'Tercer grado' : 'No definido',
      result.level_name ?? 'N/A',
      (result.score ?? '0').toString(),
      (result.elapsedTime ?? '0').toString(),
      (result.totalPairs ?? '0').toString()
    ]);

    autoTable(doc, {
      head: memoryHeaders,
      body: memoryData,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 }
      },
      didDrawPage: (data) => {
        // Si la tabla de memoria se extiende a una nueva página...
      }
    });

    // --- Sección de ADIVINA LA PALABRA OCULTA ---
    // Añadir una nueva página antes de dibujar la sección de Adivina la Palabra Oculta
    doc.addPage();
    yOffset = 10; // Reiniciar yOffset para la nueva página

    doc.setFontSize(16);
    doc.text('3. Progreso de Adivina la Palabra Oculta', 14, yOffset);
    yOffset += 10;

    const riddleHeaders = [['Nombre', 'Apellido', 'Grado', 'Nivel', 'Puntaje', 'Tiempo (segundos)', 'Palabras Adivinadas']];
    const riddleData = this.riddleResultsData.data.map(result => [
      result.name,
      result.lastname,
      result.grade === 'first' ? 'Primer grado' : result.grade === 'second' ? 'Segundo grado' : result.grade === 'third' ? 'Tercer grado' : 'No definido',
      result.level_name ?? 'N/A',
      (result.score ?? '0').toString(),
      (result.time_taken ?? '0').toString(),
      (result.words_guessed ?? '0').toString()
    ]);

    autoTable(doc, {
      head: riddleHeaders,
      body: riddleData,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 }
      },
      didDrawPage: (data) => {
        // Si la tabla de adivina la palabra se extiende a una nueva página...
      }
    });

    // Guardar el PDF
    doc.save('reporte_progreso_general.pdf');
  }

  logout() {
    this.authService.logout();
  }
}