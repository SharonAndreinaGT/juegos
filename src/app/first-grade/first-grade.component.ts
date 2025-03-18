import { Component } from '@angular/core'; 
import { MatDialog } from '@angular/material/dialog'; 
import { AddStudentDialogComponentComponent } from '../add-student-dialog-component/add-student-dialog-component.component'; 

@Component({
  selector: 'app-first-grade', 
  templateUrl: './first-grade.component.html', 
  styleUrl: './first-grade.component.css' 
})
export class FirstGradeComponent {
  students = [ // Array de objetos que representa la lista de estudiantes
    { id: 1, firstName: 'Juan', lastName: 'Pérez', grade: 1 },
    { id: 2, firstName: 'María', lastName: 'Gómez', grade: 1 }, 
  ];

  constructor(public dialog: MatDialog) { } // Inyecta el servicio MatDialog en el constructor

  // Función para abrir el modal de agregar nuevo estudiante
  openAddStudentDialog() {
    const dialogRef = this.dialog.open(AddStudentDialogComponentComponent, { // Abre el modal usando MatDialog
      width: '400px', // Establece el ancho del modal
      data: { grade: 1 } // Pasa el grado (1) como datos al modal
    });

    dialogRef.afterClosed().subscribe(result => { // Suscribe al evento afterClosed del modal
      if (result) { // Si el modal se cerró con un resultado (es decir, se agregó un estudiante)
        this.students.push(result); // Agrega el nuevo estudiante al array de estudiantes
      }
    });
  }

  // Función para editar un estudiante 
  editStudent() {
    
  }
}
