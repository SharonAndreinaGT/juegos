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
}
