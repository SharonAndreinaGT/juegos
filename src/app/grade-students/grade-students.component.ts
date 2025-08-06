import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateUserFormComponent } from '../create-user-form/create-user-form.component';
import { EditUserFormComponent } from '../edit-user-form/edit-user-form.component';
import { UserService } from '../user.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-grade-students',
  templateUrl: './grade-students.component.html',
  styleUrls: ['./grade-students.component.css'],
})
export class GradeStudentsComponent implements OnInit {
  students: any[] = [];
  allStudents: any[] = [];
  selectedSection: string = '';
  availableSections: string[] = [];
  searchTerm: string = '';
  gradeTitle: string = 'Grado: Desconocido';
  dataSource = new MatTableDataSource<any>([]);

  isAdmin: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();

    this.route.data.subscribe((data) => {
      const isAdmin = this.authService.isAdmin();
      const grade = isAdmin ? null : data['gradeFilter'];
      this.loadStudents(grade);
      this.gradeTitle = isAdmin ? 'Todos los estudiantes' : (data['gradeTitle'] || this.gradeTitle);
  });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadStudents(grade: string) {
    console.log('Cargando estudiantes del grado:', grade);
    this.userService.getUsersByGrade(grade).subscribe(
      (data: any) => {
        this.allStudents = data.data || [];
        this.students = [...this.allStudents];
        this.dataSource.data = this.students;
        this.extractAvailableSections();
      },
      (error: any) => {
        console.error('Error loading students:', error);
        this.snackBar.open('Error al cargar estudiantes', 'Cerrar', {
          duration: 3000,
        });
      }
    );
  }

  extractAvailableSections() {
    const sections = new Set<string>();
    this.allStudents.forEach((student) => {
      if (student.section) {
        sections.add(student.section);
      }
    });
    this.availableSections = Array.from(sections).sort();
  }

  applySectionFilter() {
    this.applyFilters();
  }

  applySearchFilter() {
    this.applyFilters();
  }

  applyFilters(): void {
    let filteredStudents = [...this.allStudents];
    if (this.selectedSection) {
      filteredStudents = filteredStudents.filter(
        (s) => s.section === this.selectedSection
      );
    }

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchLower) ||
          s.lastname?.toLowerCase().includes(searchLower)
      );
    }

    this.dataSource.data = filteredStudents;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  newStudent() {
    const dialogRef = this.dialog.open(CreateUserFormComponent, {
      width: '400px',
      data: { grade: this.route.snapshot.params['grade'] },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStudents(this.route.snapshot.params['grade']);
        this.snackBar.open('Estudiante registrado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  editUser(student: any) {
    const dialogRef = this.dialog.open(EditUserFormComponent, {
      width: '400px',
      data: { student: student },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStudents(this.route.snapshot.params['grade']);
        this.snackBar.open('Estudiante actualizado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  promoteStudents() {
    if (this.isAdmin) {
      this.snackBar.open('Los administradores no pueden promover estudiantes', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Obtener el grado actual del usuario logueado
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')[0];
    const currentGradeId = userInfo.grade;

    if (!currentGradeId) {
      this.snackBar.open('No se pudo obtener el grado actual', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Obtener información del grado actual para saber su level
    this.userService.getGradeFilter().then((gradeResponse: any) => {
      const currentGrade = gradeResponse.data?.[0];
      if (!currentGrade || !currentGrade.level) {
        this.snackBar.open('No se pudo obtener el nivel del grado actual', 'Cerrar', {
          duration: 3000,
        });
        return;
      }

      const currentLevel = currentGrade.level;
      const nextLevel = currentLevel + 1;

      // Buscar el siguiente grado
      this.userService.getNextGrade(currentLevel).subscribe({
        next: (nextGradeResponse: any) => {
          const nextGrade = nextGradeResponse.data?.[0];
          if (!nextGrade) {
            this.snackBar.open(`No existe un ${nextLevel}to grado`, 'Cerrar', {
              duration: 3000,
            });
            return;
          }

          // Confirmar la promoción
          const confirmMessage = `¿Está seguro de que desea promover todos los estudiantes del grado "${currentGrade.grade}" al grado "${nextGrade.grade}"? Esta acción no se puede deshacer.`;
          
          if (confirm(confirmMessage)) {
            this.userService.promoteStudents(currentGradeId, nextGrade.id).subscribe({
              next: (result: any) => {
                if (result.success) {
                  this.snackBar.open(result.message, 'Cerrar', {
                    duration: 5000,
                  });
                  // Recargar la lista de estudiantes
                  this.loadStudents(currentGradeId);
                } else {
                  this.snackBar.open(result.error || 'Error al promover estudiantes', 'Cerrar', {
                    duration: 3000,
                  });
                }
              },
              error: (error) => {
                console.error('Error al promover estudiantes:', error);
                this.snackBar.open('Error al promover estudiantes', 'Cerrar', {
                  duration: 3000,
                });
              }
            });
          }
        },
        error: (error) => {
          console.error('Error al obtener el siguiente grado:', error);
          this.snackBar.open('Error al obtener el siguiente grado', 'Cerrar', {
            duration: 3000,
          });
        }
      });
    }).catch((error) => {
      console.error('Error al obtener el grado actual:', error);
      this.snackBar.open('Error al obtener el grado actual', 'Cerrar', {
        duration: 3000,
      });
    });
  }
}
