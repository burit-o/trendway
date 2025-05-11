import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // AuthService'i import ediyoruz

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const expectedRole = route.data?.['expectedRole']; // Route tanımından beklenen rolü al
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !this.authService.isLoggedIn()) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
      return false;
    }

    if (currentUser.role === expectedRole) {
      return true; // Rol eşleşiyorsa erişime izin ver
    } else {
      // Rol eşleşmiyorsa, yetkisiz erişim sayfasına veya ana sayfaya yönlendir
      // Şimdilik ana sayfaya (veya products) yönlendirelim
      console.warn(`User with role '${currentUser.role}' tried to access '${expectedRole}' route.`);
      this.router.navigate(['/products']); 
      return false;
    }
  }
} 