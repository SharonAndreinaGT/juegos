import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-create-user-form',
  templateUrl: './create-user-form.component.html',
  styleUrl: './create-user-form.component.css'
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
      grade: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  //funcion para registrar nuevo estudiante
  registrarEstudiante() {
    if (this.studentForm.valid) {
      console.log('Estudiante Registrado:', this.studentForm.value);
      this.dialogRef.close(this.studentForm.value);
    }
  }
//funcion para cerrar el modal
  cerrarModal() {
    this.dialogRef.close();
  }
}
