import { Component, Inject, HostListener } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-edit-user-form',
  templateUrl: './edit-user-form.component.html',
  styleUrls: ['./edit-user-form.component.css']
})
export class EditUserFormComponent {
  studentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.studentForm = this.fb.group({
      id: [data.id],
      name: [data.name || '', [Validators.required, this.lettersOnlyValidator()]],
      lastname: [data.lastname || '', [Validators.required, this.lettersOnlyValidator()]],
      score: [data.score ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      section: [data.section || '', [Validators.required, this.sectionABValidator()]]
    });
  }

  // Validador para permitir solo 'A' o 'B'
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

  // Validador para permitir solo letras y convertir a minúsculas
  lettersOnlyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (value === null || value.length === 0) {
        return null;
      }
      // permite solo letras y asegura que sean minúsculas
      const onlyLowercaseLetters = /^[a-záéíóúñü]*$/;
      if (onlyLowercaseLetters.test(value)) {
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
    const formControlName = target.id; // Obtener el nombre del control del formulario

    if (formControlName === 'section') {
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
    } else if (formControlName === 'name' || formControlName === 'lastname') {
      let value = target.value;

      // Convertir a minúsculas y remover caracteres no permitidos
      const cleanedValue = value.toLowerCase().replace(/[^a-záéíóúñü]/g, '');

      if (this.studentForm.get(formControlName)?.value !== cleanedValue) {
        this.studentForm.get(formControlName)?.setValue(cleanedValue, { emitEvent: false });
        this.studentForm.get(formControlName)?.updateValueAndValidity();
      }
    }
  }

  guardarCambios() {
    this.studentForm.markAllAsTouched();
    if (this.studentForm.valid) {
      const formValue = this.studentForm.value;

      // Estandarizar la sección a mayúsculas
      if (formValue.section) {
        formValue.section = formValue.section.toUpperCase();
      }

      this.dialogRef.close(formValue);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}