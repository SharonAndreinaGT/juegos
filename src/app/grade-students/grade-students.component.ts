import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateUserFormComponent } from '../create-user-form/create-user-form.component';
import { EditUserFormComponent } from '../edit-user-form/edit-user-form.component';
import { UserService } from '../user.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-grade-students',
  templateUrl: './grade-students.component.html',
  styleUrls: ['./grade-students.component.css']
})
export class GradeStudentsComponent implements OnInit {
  students: any[] = [];
  allStudents: any[] = [];
  selectedSection: string = '';
  availableSections: string[] = [];
  searchTerm: string = '';
  gradeTitle: string = '';
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const grade = params['grade'];
      this.loadStudents(grade);
      this.setGradeTitle(grade);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadStudents(grade: string) {
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
          duration: 3000
        });
      }
    );
  }

  setGradeTitle(grade: string) {
    switch(grade) {
      case 'first':
        this.gradeTitle = 'Primer Grado';
        break;
      case 'second':
        this.gradeTitle = 'Segundo Grado';
        break;
      case 'third':
        this.gradeTitle = 'Tercer Grado';
        break;
      default:
        this.gradeTitle = 'Grado';
    }
  }

  extractAvailableSections() {
    const sections = new Set<string>();
    this.allStudents.forEach(student => {
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
      filteredStudents = filteredStudents.filter(s => s.section === this.selectedSection);
    }
    
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filteredStudents = filteredStudents.filter(s =>
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
      data: { grade: this.route.snapshot.params['grade'] }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStudents(this.route.snapshot.params['grade']);
        this.snackBar.open('Estudiante registrado exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  editUser(student: any) {
    const dialogRef = this.dialog.open(EditUserFormComponent, {
      width: '400px',
      data: { student: student }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStudents(this.route.snapshot.params['grade']);
        this.snackBar.open('Estudiante actualizado exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }
}
