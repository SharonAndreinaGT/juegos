import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-user-form',
  templateUrl: './create-user-form.component.html',
  styleUrls: ['./create-user-form.component.css']
})
export class CreateUserFormComponent {
  studentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateUserFormComponent>
  ) {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      section: ['', Validators.required],
      score: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  // Función para registrar nuevo estudiante
  registrarEstudiante(): void {
    if (this.studentForm.valid) {
      // Devuelve los datos al componente padre (grade-students)
      this.dialogRef.close(this.studentForm.value);
    }
  }

  // Función para cerrar el modal sin guardar
  cerrarModal(): void {
    this.dialogRef.close();
  }
}
