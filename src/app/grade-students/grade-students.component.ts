import { Component, input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserFormComponent } from '../create-user-form/create-user-form.component';
import { EditUserFormComponent } from '../edit-user-form/edit-user-form.component';

@Component({
  selector: 'app-grade-students',
  templateUrl: './grade-students.component.html',
  styleUrl: './grade-students.component.css'
})

export class GradeStudentsComponent implements OnInit {
  gradeTitle: string = '';
  students: any[] = [];

  constructor(private route: ActivatedRoute, private dialog: MatDialog) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.gradeTitle = data['gradeTitle'];
      this.students = data['students']; //trae los datos del array declarado en el app-routing
    });
  }


  //se crea la función del modal, donde se llama al component del form que tiene los datos para agregar el nuevo estudiante. donde se guarda en la variable result
  abrirModal() {
    const dialogRef = this.dialog.open(CreateUserFormComponent, {
      width: '400px'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nuevo estudiante:', result);
        this.students.push(result);
        // aquí se agrega el nuevo estudiante a la tabla, enviandolo al array declarado students
      }
    });
}

editUser(student: any){
  const dialogRef = this.dialog.open(EditUserFormComponent, {
    width: '400px',
    data: student 
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const index = this.students.findIndex(s => s.id === result.id);
      if (index !== -1) {
        this.students[index] = result;
      }
    }
  });
}
}
