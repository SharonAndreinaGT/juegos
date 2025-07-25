import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; 

@Component({
  selector: 'app-create-user-form',
  templateUrl: './create-user-form.component.html',
  styleUrls: ['./create-user-form.component.css']
})
export class CreateUserFormComponent {
  studentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateUserFormComponent>,
    private snackBar: MatSnackBar 

  ) {
    this.studentForm = this.fb.group({
      name: ['', [Validators.required, this.lettersOnlyValidator()]], 
      lastname: ['', [Validators.required, this.lettersOnlyValidator()]], 
      section: ['', [Validators.required, this.sectionABValidator()]],
      score: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  // Validador personalizado para permitir solo 'A' o 'B' 
  sectionABValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      // Validar si es 'A', 'a', 'B' o 'b'
      const isValidChar = (value.toLowerCase() === 'a' || value.toLowerCase() === 'b');

      // Validar que sea solo una letra
      if (isValidChar && value.length === 1) {
        return null; // El valor es válido
      } else {
        return { 'invalidSectionAB': { value: value } }; // El valor es inválido
      }
    };
  }

  // Validador personalizado para permitir solo letras
  lettersOnlyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (value === null || value.length === 0) {
        return null;
      }
      const onlyLetters = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]*$/; // Permite solo letras
      if (onlyLetters.test(value)) {
        return null;
      } else {
        return { 'lettersOnly': { value: value } };
      }
    };
  }

  // HostListener para controlar la entrada del usuario en tiempo real
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.id === 'section') {
      let value = target.value;

      // Limitar la entrada a una sola letra
      if (value.length > 1) {
        value = value.charAt(0);
      }

      // Si la letra ingresada no es 'A', 'a', 'B', 'b' y no está vacía, la resetea a vacío
      if (value !== '' && value.toLowerCase() !== 'a' && value.toLowerCase() !== 'b') {
        value = '';
      }

      if (this.studentForm.get('section')?.value !== value) {
        this.studentForm.get('section')?.setValue(value, { emitEvent: false });
        this.studentForm.get('section')?.updateValueAndValidity();
      }
    }
  }

 registrarEstudiante(): void {
  this.studentForm.markAllAsTouched();
  if (this.studentForm.valid) {
    const formValue = this.studentForm.value;

    // Estandarizar la sección a mayúsculas
    if (formValue.section) {
      formValue.section = formValue.section.toUpperCase();
    }

    // Estandarizar nombre y apellido a minúsculas antes de guardar
    if (formValue.name) {
      formValue.name = formValue.name.toLowerCase();
    }
    if (formValue.lastname) {
      formValue.lastname = formValue.lastname.toLowerCase();
    }

    // Mostrar el mensaje de éxito 
    this.snackBar.open('Estudiante registrado con éxito.', 'Cerrar', {
      duration: 3000, // Duración en milisegundos
      panelClass: ['snackbar-success'] 
    });

    this.dialogRef.close(formValue);
  }
}

  cerrarModal(): void {
    this.dialogRef.close();
  }
}