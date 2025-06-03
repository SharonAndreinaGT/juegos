import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserFormComponent } from '../create-user-form/create-user-form.component';
import { EditUserFormComponent } from '../edit-user-form/edit-user-form.component';
import { UserService } from '../user.service'; 

@Component({
  selector: 'app-grade-students',
  templateUrl: './grade-students.component.html',
  styleUrls: ['./grade-students.component.css']
})
export class GradeStudentsComponent implements OnInit {

  gradeTitle: string = '';
  gradeFilter = '';
  students: any[] = [];
  selectedSection: string = '';
  availableSections: string[] = [];
  allStudents: any[] = []; // se guardan todos los estudiantes y se filtra sobre este array

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

  // Método para obtener estudiantes por grado
  loadStudentsByGrade(grade: string): void {
  this.userService.getUsersByGrade(grade).subscribe({
    next: (response) => {
      this.allStudents = response.data;
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
    this.students = this.allStudents.filter(s => s.section === this.selectedSection);
  } else {
    this.students = [...this.allStudents]; // todas las secciones
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
