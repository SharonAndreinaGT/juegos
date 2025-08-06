import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DataExportService } from '../../data-export.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private exportService: DataExportService,
    private snackBar: MatSnackBar
  ) {}

  logout() {
    this.authService.logout();
  }

  exportData() {
    this.exportService.exportAllCollectionsAsZIP();
    this.snackBar.open('Exportando base de datos completa...', 'Cerrar', {
      duration: 4000,
      panelClass: ['snackbar-success'],
    });
  }

  isAdmin() {
    return this.authService.isAdmin();
  }
}
