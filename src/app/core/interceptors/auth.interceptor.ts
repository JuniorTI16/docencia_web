import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.obtenerToken();

    if (token === null) {
        return next(req);
    }

    const peticionConToken = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });

    return next(peticionConToken);
};
