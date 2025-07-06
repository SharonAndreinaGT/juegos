import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { MemoryService } from '../memory.service';
import { RiddleService } from '../riddle.service';

import { User } from '../puzzle-config.model';
import { PuzzleResult } from '../puzzle-config.model';
import { MemoryResult } from '../memory-config-model';
import { RiddleResult } from '../riddle.model';

import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

interface StudentProgress {
  id: string;
  name: string;
  lastname: string;
  grade?: string;
  latestPuzzleResult: PuzzleResult | null;
}

// MemoryStudentDisplay - no changes needed from previous step
interface MemoryStudentDisplay {
  id: string; // Student ID
  name: string;
  lastname: string;
  grade?: string;
  level_id: string | null;
  score: number;
  elapsedTime: number;
  totalPairs: number;
}

// NEW: RiddleStudentDisplay interface
interface RiddleStudentDisplay {
  id: string; // Student ID
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

  // Definimos las columnas que usará la tabla de ROMPECABEZAS
  displayedColumns: string[] = ['name', 'lastname', 'grade', 'level_name','score', 'time'];
  // Definimos las columnas que usará la tabla de MEMORIA
  displayedMemoryColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_id',
    'score',
    'elapsedTime',
    'totalPairs',
  ];
  // NEW: Definimos las columnas que usará la tabla de ADIVINA LA PALABRA OCULTA
  displayedRiddleColumns: string[] = [
    'name',
    'lastname',
    'grade',
    'level_name',
    'score',
    'time_taken',
    'words_guessed',
  ];

  // MatTableDataSource para la paginación, orden y filtrado
  studentProgressData = new MatTableDataSource<StudentProgress>([]);
  memoryResultsData = new MatTableDataSource<MemoryStudentDisplay>([]);
  // NEW: MatTableDataSource for Riddle results
  riddleResultsData = new MatTableDataSource<RiddleStudentDisplay>([]);

  loading = true;
  loadingMemoryResults = true;
  loadingRiddleResults = true; // NEW: Loading state for Riddle
  error: string | null = null;
  errorMemoryResults: string | null = null;
  errorRiddleResults: string | null = null; // NEW: Error state for Riddle

  // Referencia al paginador de Angular Material para rompecabezas
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // Referencia al paginador de Angular Material para memoria
  @ViewChild('memoryPaginator') memoryPaginator!: MatPaginator;
  // NEW: Referencia al paginador de Angular Material para Adivina la Palabra Oculta
  @ViewChild('riddlePaginator') riddlePaginator!: MatPaginator;


  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService,
    private memoryService: MemoryService,
    private riddleService: RiddleService 
  ) {}

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
 
  // metodod para traer los estudiantes que hayan jugado memory
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
                  level_id: latestMemoryResult.level_id,
                  score: latestMemoryResult.score,
                  elapsedTime: latestMemoryResult.elapsedTime,
                  totalPairs: latestMemoryResult.totalPairs,
                } as MemoryStudentDisplay;
              } else {
                return {
                  id: user.id,
                  name: user.name,
                  lastname: user.lastname,
                  grade: user.grade,
                  level_id: null,
                  score: 0,
                  elapsedTime: 0,
                  totalPairs: 0,
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
                level_id: null,
                score: 0,
                elapsedTime: 0,
                totalPairs: 0,
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

  //metodo para traer los estudiantes que hayan juagdo riddle
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
}