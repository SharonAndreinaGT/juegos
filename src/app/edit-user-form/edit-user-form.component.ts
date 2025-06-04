import { Component, Inject, HostListener } from '@angular/core'; // Agregamos HostListener
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms'; // Agregamos AbstractControl, ValidatorFn

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
      name: [data.name || '', Validators.required],
      lastname: [data.lastname || '', Validators.required],
      score: [data.score ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      // se aplica el validador personalizado 'sectionABValidator'
      section: [data.section || '', [Validators.required, this.sectionABValidator()]] // Valor inicial de la sección para edición
    });
  }

  // Validador personalizado para permitir solo 'A' o 'B' 
  sectionABValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value; //con value se obtiene el valor actual

      if (value === null || value === undefined || value === '') {
        return null; // permite que Validators.required maneje el campo vacío
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

  // HostListener para controlar la entrada del usuario en tiempo real
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.id === 'section') {
      let value = target.value;

      // Limitar la entrada a una sola letra, con la longitud
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

  guardarCambios() {
    this.studentForm.markAllAsTouched(); // Para mostrar errores si el formulario no es válido
    if (this.studentForm.valid) {
      // Obtenemos el valor del formulario
      const formValue = this.studentForm.value;

      // convierte la sección a mayúscula antes de cerrar y enviarlo al backend
      if (formValue.section) { 
        formValue.section = formValue.section.toUpperCase();
      }

      this.dialogRef.close(formValue); // Envia el valor modificado
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}