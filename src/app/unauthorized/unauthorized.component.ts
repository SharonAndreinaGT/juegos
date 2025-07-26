import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-content>
          <h2>Acceso No Autorizado</h2>
          <p>Debes iniciar sesión para acceder a esta página.</p>
          <button mat-raised-button color="primary" (click)="goToLogin()">
            Ir al Login
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    
    .unauthorized-card {
      max-width: 400px;
      text-align: center;
      padding: 2rem;
    }
    
    h2 {
      color: #d32f2f;
      margin-bottom: 1rem;
    }
    
    p {
      margin-bottom: 2rem;
      color: #666;
    }
    
    button {
      margin-top: 1rem;
    }
  `]
})
export class UnauthorizedComponent {

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  goToLogin() {
    // Obtener la URL de retorno si existe
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/main';
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
} 