import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { PuzzleService } from '../puzzle.service';
import { User } from '../puzzle-config.model';
import { PuzzleResult } from '../puzzle-config.model';
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

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit, AfterViewInit {

  // Definimos las columnas que usará la tabla
  displayedColumns: string[] = ['name', 'lastname','grade', 'score', 'time'];

  // MatTableDataSource  para la paginación, orden y filtrado
  studentProgressData = new MatTableDataSource<StudentProgress>([]);

  loading = true;
  error: string | null = null;

  // Referencia al paginador de Angular Material
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private userService: UserService,
    private puzzleService: PuzzleService
  ) {}

  ngOnInit(): void {
    this.loadAllStudentsProgress();
  }

  // Asignamos el paginador luego que la vista está inicializada
  ngAfterViewInit(): void {
    // Se recomienda usar setTimeout para evitar posibles errores con tabs ocultos
    setTimeout(() => {
      this.studentProgressData.paginator = this.paginator;
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
                latestPuzzleResult: latestResult
              } as StudentProgress;
            }),
            catchError(err => {
              console.error(`Error al obtener resultados para el estudiante ${user.name} (ID: ${user.id}):`, err);
              return of({
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                grade: user.grade,
                latestPuzzleResult: null
              } as StudentProgress);
            })
          );
        });

        return forkJoin(progressObservables);
      }),
      catchError(err => {
        console.error('Error al cargar el progreso de todos los estudiantes:', err);
        this.error = 'Error al cargar el progreso general de los estudiantes. Por favor, inténtalo de nuevo.';
        this.loading = false;
        return of([]);
      })
    ).subscribe(
      (progressData: StudentProgress[]) => {
        this.studentProgressData.data = progressData;  // Aquí asignamos al MatTableDataSource
        this.loading = false;
        console.log('[ProgressComponent] Progreso de estudiantes cargado:', this.studentProgressData.data);
      },
      () => {
        this.loading = false;
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