import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Player, PlayerAccess } from '../models/player.model';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    this.authService.start();
    const roles = route.data.access as Array<PlayerAccess>;
    const obs = new Observable<boolean>((subscriber) => {
      this.authService
        .getPlayer()
        //.pipe(take(1))
        .subscribe((user: Player) => {
          subscriber.next(roles.includes(user.access));
        });
    });
    return obs;
  }
}
