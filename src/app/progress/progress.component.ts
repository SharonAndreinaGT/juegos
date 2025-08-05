import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { MemoryService } from '../memory.service';
import { RiddleService } from '../riddle.service';
import { AuthService } from '../auth.service';
import { Chart, ChartConfiguration } from 'chart.js';

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

  displayedColumns: string[] = ['name', 'lastname', 'grade', 'level_name', 'score', 'time', 'actions'];
  displayedMemoryColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_name',
    'score',
    'elapsedTime',
    'totalPairs',
    'actions',
  ];
  displayedRiddleColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_name',
    'score',
    'time_taken',
    'words_guessed',
    'actions',
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

  // Propiedades para el filtrado por grado
  currentGrade: string = '';
  gradeTitle: string = 'Progreso General';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('memoryPaginator') memoryPaginator!: MatPaginator;
  @ViewChild('riddlePaginator') riddlePaginator!: MatPaginator;
  @ViewChild('progressChart', { static: false }) progressChartRef!: ElementRef<HTMLCanvasElement>;

  // Propiedades para el modal de progreso
  selectedStudentId: string | null = null;
  selectedStudentName: string = '';
  showProgressModal = false;
  progressData: any = {
    puzzle: [],
    memory: [],
    riddle: []
  };
  loadingProgressData = false;


  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService,
    private memoryService: MemoryService,
    private riddleService: RiddleService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getCurrentGrade();
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

  // Método para obtener el grado actual del usuario autenticado
private getCurrentGrade(): void {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')[0];

    // Si es admin, no se filtra por grado (muestra todos los estudiantes)
    if (this.authService.isAdmin()) {
      this.currentGrade = ''; // Esto hará que se usen getUsers() en lugar de getUsersByGrade()
    } else {
      this.currentGrade = userInfo?.grade || '';
    }

    this.updateGradeTitle();
    this.loadAllStudentsProgress();
    this.loadAllStudentsMemoryResults();
    this.loadAllStudentsRiddleResults();
  } catch (error) {
    console.error('Error al obtener el grado del usuario:', error);
    this.currentGrade = '';
    this.loadAllStudentsProgress();
    this.loadAllStudentsMemoryResults();
    this.loadAllStudentsRiddleResults();
  }
}

  // Método para actualizar el título según el grado
private updateGradeTitle(): void {
  if (this.authService.isAdmin()) {
    this.gradeTitle = 'Progreso General (Administrador)';
    return;
  }

  switch (this.currentGrade) {
    case 'first':
      this.gradeTitle = 'Progreso - Primer Grado';
      break;
    case 'second':
      this.gradeTitle = 'Progreso - Segundo Grado';
      break;
    case 'third':
      this.gradeTitle = 'Progreso - Tercer Grado';
      break;
    default:
      this.gradeTitle = 'Progreso General';
      break;
  }
}

  loadAllStudentsProgress(): void {
    this.loading = true;
    this.error = null;

    // Usar getUsersByGrade si hay un grado específico, sino usar getUsers
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loading = false;
          this.error = this.currentGrade 
            ? `No se encontraron estudiantes en ${this.gradeTitle}.`
            : 'No se encontraron estudiantes.';
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

    // Usar getUsersByGrade si hay un grado específico, sino usar getUsers
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loadingMemoryResults = false;
          this.errorMemoryResults = this.currentGrade 
            ? `No se encontraron estudiantes en ${this.gradeTitle} para los resultados de memoria.`
            : 'No se encontraron estudiantes para los resultados de memoria.';
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

    // Usar getUsersByGrade si hay un grado específico, sino usar getUsers
    const usersObservable = this.currentGrade 
      ? this.userService.getUsersByGrade(this.currentGrade)
      : this.userService.getUsers();

    usersObservable.pipe(
      map(response => response.data as User[]),
      switchMap(users => {
        if (!users || users.length === 0) {
          this.loadingRiddleResults = false;
          this.errorRiddleResults = this.currentGrade 
            ? `No se encontraron estudiantes en ${this.gradeTitle} para los resultados de "Adivina la Palabra Oculta".`
            : 'No se encontraron estudiantes para los resultados de "Adivina la Palabra Oculta".';
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
    doc.text(`Reporte de ${this.gradeTitle}`, 14, yOffset);
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
        // Si la tabla de rompecabezas se extiende a una nueva página
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
    const fileName = this.currentGrade 
      ? `reporte_progreso_${this.currentGrade}_grado.pdf`
      : 'reporte_progreso_general.pdf';
    doc.save(fileName);
  }

  logout() {
    this.authService.logout();
  }

  // Método para abrir el modal de progreso individual
  viewStudentProgress(studentId: string, studentName: string): void {
    this.selectedStudentId = studentId;
    this.selectedStudentName = studentName;
    this.showProgressModal = true;
    this.loadingProgressData = true;
    
    // Cargar datos de progreso del estudiante
    this.loadStudentProgressData(studentId);
  }

  // Método para cargar datos de progreso de un estudiante
  private loadStudentProgressData(studentId: string): void {
    forkJoin({
      puzzleResults: this.puzzleService.getStudentPuzzleResults(studentId),
      memoryResults: this.memoryService.getStudentMemoryResults(studentId),
      riddleResults: this.riddleService.getStudentRiddleResults(studentId)
    }).subscribe({
      next: (results) => {
        this.progressData = {
          puzzle: results.puzzleResults || [],
          memory: results.memoryResults || [],
          riddle: results.riddleResults || []
        };
        this.loadingProgressData = false;
        
        // Crear el gráfico después de cargar los datos
        setTimeout(() => {
          this.createProgressChart();
        }, 100);
      },
      error: (error) => {
        console.error('Error cargando datos de progreso:', error);
        this.loadingProgressData = false;
      }
    });
  }

  // Método para crear el gráfico de progreso
  private createProgressChart(): void {
    if (!this.progressChartRef) return;

    const ctx = this.progressChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.getProgressChartData();
    
    new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              maxTicksLimit: 8
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          },
          line: {
            tension: 0.4
          }
        }
      }
    });
  }

  // Método para cerrar el modal
  closeProgressModal(): void {
    this.showProgressModal = false;
    this.selectedStudentId = null;
    this.selectedStudentName = '';
    this.progressData = { puzzle: [], memory: [], riddle: [] };
  }

  // Método para obtener datos del gráfico de progreso
  getProgressChartData(): any {
    const allResults = [
      ...this.progressData.puzzle.map((r: any) => ({ ...r, game: 'Puzzle', date: r.created_at })),
      ...this.progressData.memory.map((r: any) => ({ ...r, game: 'Memoria', date: r.created_at })),
      ...this.progressData.riddle.map((r: any) => ({ ...r, game: 'Riddle', date: r.created_at }))
    ];

    // Ordenar por fecha
    allResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      labels: allResults.map((r: any) => {
        const date = new Date(r.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: 'Rompecabezas',
          data: allResults.filter((r: any) => r.game === 'Puzzle').map((r: any) => r.score || 0),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          tension: 0.4
        },
        {
          label: 'Memoria',
          data: allResults.filter((r: any) => r.game === 'Memoria').map((r: any) => r.score || 0),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        },
        {
          label: 'Adivina la palabra oculta',
          data: allResults.filter((r: any) => r.game === 'Riddle').map((r: any) => r.score || 0),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        }
      ]
    };
  }

  // Métodos auxiliares para estadísticas
  getBestScore(results: any[], field: string): number {
    if (!results || results.length === 0) return 0;
    return Math.max(...results.map((r: any) => r[field] || 0));
  }

  getAverageScore(results: any[], field: string): number {
    if (!results || results.length === 0) return 0;
    const sum = results.reduce((acc: number, r: any) => acc + (r[field] || 0), 0);
    return sum / results.length;
  }

  //Con este metodo solo podrá acceder a distintas funcionalidades solo si es administrador
  isAdmin() {
    return this.authService.isAdmin();
  }
}