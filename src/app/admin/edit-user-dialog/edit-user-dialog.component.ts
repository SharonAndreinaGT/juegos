import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TeacherService } from '../../teacher.service';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css'],
})
export class EditUserDialogComponent implements OnInit {
  userForm: FormGroup;
  isLoading = false;
  grades: any = [];
  sections: any = [];

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userForm = this.fb.group({
      first_name: [data.first_name || '', [Validators.required]],
      last_name: [data.last_name || '', [Validators.required]],
      email: [data.email || '', [Validators.required, Validators.email]],
      status: [data.status || 'active', [Validators.required]],
      grade: [data.grade || '', [Validators.required]],
      section: [data.section || '', [Validators.required]],
    });
  }

  async ngOnInit() {
    this.grades = await this.loadGrades();
    this.sections = await this.loadSections();
  }

  async onSave() {
    if (this.userForm.valid) {
      this.isLoading = true;
      try {
        const updatedUser = { ...this.data, ...this.userForm.value };
        const result = await firstValueFrom(
          this.teacherService.updateUser(this.data.id, this.userForm.value)
        );
        this.dialogRef.close(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        // You might want to show an error message here
        this.isLoading = false;
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  async loadGrades() {
    try {
      const grades = await firstValueFrom(this.teacherService.getGrades());
      return grades.data || []; // Assuming the API returns an object with a 'data' property
    } catch (error) {
      console.error('Error loading grades:', error);
      return []; // Return an empty array in case of error
    }
  }

  async loadSections() {
    try {
      const sections = await firstValueFrom(this.teacherService.getSections());
      return sections.data || []; // Assuming the API returns an object with a 'data' property
    } catch (error) {
      console.error('Error loading sections:', error);
      return []; // Return an empty array in case of error
    }
  }
}
