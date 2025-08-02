import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { TeacherService } from '../teacher.service';
import { UserService } from '../user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent {
  constructor(
    private teacherService: TeacherService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  roles: any = [];
  users: any = [];
  displayedColumns: string[] = ['first_name', 'last_name', 'email', 'status', 'actions'];

  async ngOnInit() {
    this.roles = await this.loadRoles();
    this.users = await this.loadUsers(
      this.roles.filter((role: any) => role.name === 'teacher')[0]?.id
    );
  }

  async loadUsers(roleId: string) {
    try {
      const users = await firstValueFrom(this.teacherService.getUsers(roleId));
      return users.data || []; // Assuming the API returns an object with a 'data' property
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadRoles() {
    try {
      const roles = await firstValueFrom(this.teacherService.getRoles());
      return roles.data || []; // Assuming the API returns an object with a 'data' property
    } catch (error) {
      console.error('Error loading roles:', error);
      return []; // Return an empty array in case of error
    }
  }

  editUser(user: any) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '550px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User was updated, refresh the users list
        console.log('User updated:', result);
        this.refreshUsers();
      }
    });
  }

  private async refreshUsers() {
    try {
      this.users = await this.loadUsers(
        this.roles.filter((role: any) => role.name === 'teacher')[0]?.id
      );
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  }
}
