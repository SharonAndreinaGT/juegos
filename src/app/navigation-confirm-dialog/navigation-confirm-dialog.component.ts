import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

export interface NavigationConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-navigation-confirm-dialog',
  templateUrl: './navigation-confirm-dialog.component.html',
  styleUrls: ['./navigation-confirm-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule]
})
export class NavigationConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NavigationConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NavigationConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 