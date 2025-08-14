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
  availableSections: { label: string; value: string }[] = [];
  searchTerm: string = '';
  gradeTitle: string = 'Grado: Desconocido';
  dataSource = new MatTableDataSource<any>([]);

  isAdmin: boolean = false;
  isLastGrade: boolean = false; // Nueva propiedad para determinar si es el último grado

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

    // ✅ Escuchar cambios en el localStorage para gradeFilter
    window.addEventListener('storage', (event) => {
      if (event.key === 'gradeFilter') {
        console.log('gradeFilter cambió, recargando datos...');
        this.reloadDataFromLocalStorage();
      }
    });

    // ✅ También verificar al entrar si hay gradeFilter en localStorage
    this.reloadDataFromLocalStorage();
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
        this.checkIfLastGrade(grade); // Verificar si es el último grado
      },
      (error: any) => {
        console.error('Error loading students:', error);
        this.snackBar.open('Error al cargar estudiantes', 'Cerrar', {
          duration: 3000,
        });
      }
    );
  }

  // Método para verificar si es el último grado
  checkIfLastGrade(gradeId: string) {
    this.userService.getGradeFilter().then((gradeResponse: any) => {
      const currentGrade = gradeResponse.data?.[0];
      if (currentGrade && currentGrade.level) {
        const currentLevel = currentGrade.level;
        const nextLevel = currentLevel + 1;

        this.userService.getNextGrade(currentLevel).subscribe({
          next: (nextGradeResponse: any) => {
            const nextGrade = nextGradeResponse.data?.[0];
            this.isLastGrade = !nextGrade; // Si no hay grado siguiente, es el último
          },
          error: (error) => {
            console.error('Error al verificar si es el último grado:', error);
            this.isLastGrade = false;
          }
        });
      }
    }).catch((error) => {
      console.error('Error al obtener el grado actual:', error);
      this.isLastGrade = false;
    });
  }

  // ✅ Método para recargar datos desde localStorage
  reloadDataFromLocalStorage() {
    const gradeFilterData = localStorage.getItem('gradeFilter');
    if (gradeFilterData) {
      try {
        const parsedData = JSON.parse(gradeFilterData);
        const gradeId = parsedData.data[0].id;
        console.log('Recargando datos con gradeId:', gradeId);
        this.loadStudents(gradeId);
        this.gradeTitle = `Grado: ${parsedData.data[0].grade}`;
      } catch (error) {
        console.error('Error parsing gradeFilter:', error);
      }
    }
  }

  extractAvailableSections() {
    // ✅ Usar objetos con label y value para las secciones A y B
    this.availableSections = [
      { label: 'A', value: '7f45c3d4-2d12-4fdc-a9df-af1d8198275f' },
      { label: 'B', value: '7fe05ed9-edd0-4e1b-b2d4-7da83ae455f5' }
    ];
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
      console.log('Filtrando por sección:', this.selectedSection);
      console.log('Ejemplo de estudiante:', filteredStudents[0]);
      filteredStudents = filteredStudents.filter(
        (s) => {
          // ✅ Comparar con el ID de la sección
          const sectionId = s.section?.id || s.section;
          console.log(`Estudiante ${s.name}: sectionId = ${sectionId}, selectedSection = ${this.selectedSection}`);
          return sectionId === this.selectedSection;
        }
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
        // ✅ Usar gradeFilter del localStorage en lugar del parámetro de la ruta
        const gradeFilterData = localStorage.getItem('gradeFilter');
        let gradeId = this.route.snapshot.params['grade']; // fallback
        
        if (gradeFilterData) {
          try {
            const parsedData = JSON.parse(gradeFilterData);
            gradeId = parsedData.data[0].id;
          } catch (error) {
            console.error('Error parsing gradeFilter:', error);
          }
        }
        
        this.loadStudents(gradeId);
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
            // No existe un grado siguiente, eliminar estudiantes
            const confirmMessage = `¿Está seguro de que desea promover todos los estudiantes del grado "${currentGrade.grade}"? Esta acción no se puede deshacer.`;
            
            if (confirm(confirmMessage)) {
              this.userService.deleteStudentsByGrade(currentGradeId).subscribe({
                next: (result: any) => {
                  if (result.success) {
                    this.snackBar.open(result.message, 'Cerrar', {
                      duration: 5000,
                    });
                    // Recargar la lista de estudiantes
                    this.loadStudents(currentGradeId);
                  } else {
                    this.snackBar.open(result.error || 'Error al eliminar estudiantes', 'Cerrar', {
                      duration: 3000,
                    });
                  }
                },
                error: (error) => {
                  console.error('Error al eliminar estudiantes:', error);
                  this.snackBar.open('Error al eliminar estudiantes', 'Cerrar', {
                    duration: 3000,
                  });
                }
              });
            }
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
