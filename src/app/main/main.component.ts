import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent {
  docenteNombre: string = '';

  constructor(private router: Router, private authService: AuthService) {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      this.docenteNombre =
        parsedInfo[0]?.first_name + ' ' + parsedInfo[0]?.last_name || '';
    }
  }


  navigateTo(view: string) {
    this.router.navigate([view]);
  }

  isAdmin() {
    return this.authService.isAdmin();
  }
}
