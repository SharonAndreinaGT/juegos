import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NavigationConfirmDialogComponent } from './navigation-confirm-dialog/navigation-confirm-dialog.component';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationGuardService implements CanDeactivate<CanComponentDeactivate> {

  constructor(private dialog: MatDialog) {}

  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate ? component.canDeactivate() : true;
  }

  showNavigationConfirmDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(NavigationConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Confirmar Salida',
        message: 'Si sales de esta pantalla perderás los datos de la partida actual y no se guardará tu progreso. ¿Estás seguro de que quieres salir?'
      }
    });

    return dialogRef.afterClosed();
  }
} 