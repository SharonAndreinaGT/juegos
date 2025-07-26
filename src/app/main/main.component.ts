import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent  {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateTo(view: string) {
    this.router.navigate([view]);
  }

  logout() {
    this.authService.logout();
  }
}