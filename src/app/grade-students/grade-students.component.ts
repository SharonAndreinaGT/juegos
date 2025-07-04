import { Component, OnInit, ViewChild } from '@angular/core'; 
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
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

  gradeTitle: string = '';
  gradeFilter = '';
  selectedSection: string = '';
  availableSections: string[] = [];
  allStudents: any[] = []; 

  
  dataSource = new MatTableDataSource<any>(); 

  @ViewChild(MatPaginator) paginator!: MatPaginator; 

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.gradeTitle = data['gradeTitle'];
      this.gradeFilter = data['gradeFilter'];
      this.loadStudentsByGrade(this.gradeFilter);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  // Método para obtener estudiantes por grado
  loadStudentsByGrade(grade: string): void {
    this.userService.getUsersByGrade(grade).subscribe({
      next: (response) => {
        this.allStudents = response.data;
        this.dataSource.data = this.allStudents; 
        this.extractSections(); // Para llenar el filtro dinámico
        this.applySectionFilter(); // Para inicializar lista filtrada
      },
      error: (err) => {
        console.error('Error cargando estudiantes:', err);
      }
    });
  }

  extractSections(): void {
    const secciones = this.allStudents.map(s => s.section).filter(Boolean);
    this.availableSections = Array.from(new Set(secciones));
  }

  applySectionFilter(): void {
    if (this.selectedSection) {
      this.dataSource.data = this.allStudents.filter(s => s.section === this.selectedSection);
    } else {
      this.dataSource.data = [...this.allStudents]; 
    }
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  newStudent() {
    const dialogRef = this.dialog.open(CreateUserFormComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Agregamos el grado actual al nuevo estudiante
        const newUser = { ...result, grade: this.gradeFilter };

        this.userService.createUser(newUser).subscribe({
          next: () => this.loadStudentsByGrade(this.gradeFilter), //Se crea el nuevo estudiante pasandolo por el filtro del grado
          error: (err) => console.error('Error al crear usuario:', err)
        });
      }
    });
  }

  editUser(student: any) {
    const dialogRef = this.dialog.open(EditUserFormComponent, {
      width: '400px',
      data: student
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(result.id, result).subscribe(() => {
          this.loadStudentsByGrade(this.gradeFilter); // recarga la lista filtrada
        });
      }
    });
  }
}
