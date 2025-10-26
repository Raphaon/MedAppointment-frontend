import { Injectable } from '@angular/core';
import { UserService } from '@app/core/services/user.service';
import { User, UserRole } from '@app/core/models';
import { BehaviorSubject, Observable, Subject, combineLatest, map, of, shareReplay, startWith, switchMap, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersState {
  private readonly selectedRoleSubject = new BehaviorSubject<UserRole | null>(null);
  private readonly refreshSubject = new Subject<void>();
  private readonly errorSubject = new Subject<string>();

  readonly selectedRole$ = this.selectedRoleSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  readonly users$: Observable<User[]> = combineLatest([
    this.selectedRoleSubject.asObservable(),
    this.refreshSubject.pipe(startWith(void 0))
  ]).pipe(
    switchMap(([role]) =>
      this.userService.getAllUsers(role ?? undefined).pipe(
        map(response => response.users ?? []),
        catchError(() => {
          this.errorSubject.next('Erreur lors du chargement des utilisateurs');
          return of([]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly userService: UserService) {}

  setRole(role: UserRole | null): void {
    this.selectedRoleSubject.next(role);
  }

  refresh(): void {
    this.refreshSubject.next();
  }
}
