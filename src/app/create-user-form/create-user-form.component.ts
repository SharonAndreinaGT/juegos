import { Component, HostListener, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-user-form',
  templateUrl: './create-user-form.component.html',
  styleUrls: ['./create-user-form.component.css']
})
export class CreateUserFormComponent {
  studentForm: FormGroup;
  private gradeId: string;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateUserFormComponent>,
    private snackBar: MatSnackBar,
    private userService: UserService,
    // ✅ Se inyecta MAT_DIALOG_DATA para obtener el ID del grado
    @Inject(MAT_DIALOG_DATA) public data: { grade: string }
  ) {
    this.gradeId = data.grade; // ✅ Se asigna el ID del grado
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
      const isValidChar = (value.toLowerCase() === 'a' || value.toLowerCase() === 'b');
      if (isValidChar && value.length === 1) {
        return null; 
      } else {
        return { 'invalidSectionAB': { value: value } }; 
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
      if (value.length > 1) {
        value = value.charAt(0);
      }
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

      if (formValue.section) {
        formValue.section = formValue.section.toUpperCase();
      }
      if (formValue.name) {
        formValue.name = formValue.name.toLowerCase();
      }
      if (formValue.lastname) {
        formValue.lastname = formValue.lastname.toLowerCase();
      }

      try {
        // Se obtiene el ID de la sección antes de la validación
        const sectionId = await firstValueFrom(this.userService.getSectionIdByName(formValue.section));

        // Se valida con el ID de la sección y del grado
        const isDuplicate = await firstValueFrom(this.userService.checkIfStudentExists(
            formValue.name,
            formValue.lastname,
            sectionId,
            this.gradeId
        ));

        if (isDuplicate) {
          this.snackBar.open('Error: Ya existe un estudiante con el mismo nombre, apellido y sección en este grado.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          return;
        }

        // ✅ Se crea el objeto de datos con los IDs de las relaciones
        const studentData = {
          name: formValue.name,
          lastname: formValue.lastname,
          score: formValue.score,
          grade: this.gradeId, // ✅ Se envía el ID del grado
          section: sectionId // ✅ Se envía el ID de la sección
        };
        
        // ✅ Ahora sí, se llama al servicio para crear el estudiante
        this.userService.createUser(studentData).subscribe(
            (response) => {
                this.snackBar.open('Estudiante registrado exitosamente', 'Cerrar', {
                    duration: 3000
                });
                this.dialogRef.close(true); // Cierra y notifica el éxito
            },
            (error) => {
                console.error('Error al registrar estudiante:', error);
                this.snackBar.open('Error al registrar el estudiante', 'Cerrar', {
                    duration: 3000
                });
                this.dialogRef.close(false); // Cierra y notifica el error
            }
        );
      } catch (error) {
        console.error('Error en el proceso de registro:', error);
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