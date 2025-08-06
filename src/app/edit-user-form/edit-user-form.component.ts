import { Component, Inject, HostListener, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { TeacherService } from '../teacher.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-edit-user-form',
  templateUrl: './edit-user-form.component.html',
  styleUrls: ['./edit-user-form.component.css'],
})
export class EditUserFormComponent implements OnInit {
  studentForm: FormGroup;
  sections: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserFormComponent>,
    private teacherService: TeacherService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Acceder a los datos del estudiante correctamente
    // Soporta tanto data.student como data directo para mayor flexibilidad
    const student = data.student || data;

    this.studentForm = this.fb.group({
      id: [student.id],
      name: [
        student.name || '',
        [Validators.required, this.lettersOnlyValidator()],
      ],
      lastname: [
        student.lastname || '',
        [Validators.required, this.lettersOnlyValidator()],
      ],
      score: [
        student.score ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      section: [student.section.id || '', [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadSections();
  }

  loadSections() {
    this.teacherService.getSections().subscribe({
      next: (response) => {
        this.sections = response.data || [];
        console.log('Secciones cargadas:', this.sections);
      },
      error: (error) => {
        console.error('Error al cargar secciones:', error);
        // Fallback con las secciones por defecto
        this.sections = [
          { id: 'A', name: 'A' },
          { id: 'B', name: 'B' },
        ];
      },
    });
  }

  // Validador para permitir solo letras y convertir a minúsculas
  lettersOnlyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (value === null || value.length === 0) {
        return null;
      }
      // permite solo letras y asegura que sean minúsculas
      const onlyLowercaseLetters = /^[A-Za-záéíóúñü]*$/;
      if (onlyLowercaseLetters.test(value)) {
        return null;
      } else {
        return { lettersOnly: { value: value } };
      }
    };
  }

  // HostListener para controlar la entrada del usuario en tiempo real
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const formControlName = target.id; // Obtener el nombre del control del formulario

    if (formControlName === 'name' || formControlName === 'lastname') {
      let value = target.value;

      // Convertir a minúsculas y remover caracteres no permitidos
      const cleanedValue = value.toLowerCase().replace(/[^a-záéíóúñü]/g, '');

      if (this.studentForm.get(formControlName)?.value !== cleanedValue) {
        this.studentForm
          .get(formControlName)
          ?.setValue(cleanedValue, { emitEvent: false });
        this.studentForm.get(formControlName)?.updateValueAndValidity();
      }
    }
  }

  guardarCambios() {
    this.studentForm.markAllAsTouched();
    if (this.studentForm.valid) {
      this.userService
        .updateStudent(this.studentForm.value.id, this.studentForm.value)
        .subscribe({
          next: (response) => {
            console.log('Estudiante actualizado:', response);
            const formValue = this.studentForm.value;
            window.location.reload(); // Recargar la página para reflejar los cambios
            this.dialogRef.close(formValue);
          },
        });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}
