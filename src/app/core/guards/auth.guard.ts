import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Vérifier les rôles si spécifiés
      const requiredRoles = this.collectRoles(route);
      if (requiredRoles.length > 0) {
        const user = this.authService.getCurrentUser();
        if (user && requiredRoles.includes(user.role)) {
          return true;
        }
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  private collectRoles(route: ActivatedRouteSnapshot | null): string[] {
    if (!route) {
      return [];
    }

    const currentRoles = Array.isArray(route.data?.['roles']) ? route.data['roles'] as string[] : [];
    const parentRoles = this.collectRoles(route.parent);

    return Array.from(new Set([...parentRoles, ...currentRoles]));
  }
}
