import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../user.service';

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
    private snackBar: MatSnackBar,
    private userService: UserService 
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
      // Expresión regular que permite solo letras (incluyendo acentos y ñ/Ñ)
      const onlyLetters = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]*$/;
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

  async registrarEstudiante(): Promise<void> {
    this.studentForm.markAllAsTouched();
    if (this.studentForm.valid) {
      const formValue = this.studentForm.value;

      // Estandarizar la sección a mayúsculas
      if (formValue.section) {
        formValue.section = formValue.section.toUpperCase();
      }

      // Estandarizar nombre y apellido a minúsculas antes de guardar
      // Esto es importante para la consistencia en la base de datos y la validación de duplicados
      if (formValue.name) {
        formValue.name = formValue.name.toLowerCase();
      }
      if (formValue.lastname) {
        formValue.lastname = formValue.lastname.toLowerCase();
      }

      // Validación para evitar registros duplicados usando el UserService
      try {
        const isDuplicate = await this.userService.checkIfStudentExists(
          formValue.name,
          formValue.lastname,
          formValue.section
        ).toPromise(); // Convertir el Observable a Promise

        if (isDuplicate) {
          this.snackBar.open('Error: Ya existe un estudiante con el mismo nombre, apellido y sección.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error'] // Clase CSS opcional para estilos de error
          });
          return; // Detener el proceso si es un duplicado
        }

        // Si no es un duplicado, procede con el registro
        this.snackBar.open('Estudiante registrado con éxito.', 'Cerrar', {
          duration: 3000, // Duración en milisegundos
          panelClass: ['snackbar-success'] // Clase CSS opcional para estilos de éxito
        });

        this.dialogRef.close(formValue);
      } catch (error) {
        console.error('Error al verificar duplicados o registrar estudiante:', error);
        this.snackBar.open('Ocurrió un error al intentar registrar el estudiante. Por favor, inténtalo de nuevo.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    }
  }

  cerrarModal(): void {
    this.dialogRef.close();
  }
}
