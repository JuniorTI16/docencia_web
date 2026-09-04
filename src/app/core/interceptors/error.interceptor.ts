import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                authService.cerrarSesion();
            }

            if (error.status === 403) {
                const mensaje = error.error?.message as string | undefined;

                if (mensaje?.includes('segundo factor') === true) {
                    void router.navigate(['/mfa']);
                }
            }

            return throwError(() => error);
        }),
    );
};
