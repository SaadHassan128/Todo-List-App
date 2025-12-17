import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const isAuthenticated = this.authService.isAuthenticated$();
    if (!isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return of(false);
    }
    return of(true);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const isAuthenticated = this.authService.isAuthenticated$();
    if (isAuthenticated) {
      this.router.navigate(['/dashboard']);
      return of(false);
    }
    return of(true);
  }
}
