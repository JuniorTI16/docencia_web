import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { RespuestaLogin, SesionUsuario } from '../models/auth.model';

const CLAVE_TOKEN = 'docencia_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly tokenSignal = signal<string | null>(this.leerTokenGuardado());

    readonly sesion = computed<SesionUsuario | null>(() => {
        const token = this.tokenSignal();
        return token === null ? null : this.decodificarToken(token);
    });

    readonly autenticado = computed<boolean>(() => this.sesion() !== null);

    readonly mfaPendiente = computed<boolean>(() => {
        const sesion = this.sesion();
        return sesion !== null && !sesion.mfaVerificado;
    });

    readonly roles = computed<string[]>(() => this.sesion()?.roles ?? []);

    async login(username: string, password: string): Promise<RespuestaLogin> {
        const respuesta = await firstValueFrom(
            this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, {
                username,
                password,
            }),
        );

        this.guardarToken(respuesta.accessToken);
        return respuesta;
    }

    async verificarMfa(codigo: string): Promise<void> {
        const respuesta = await firstValueFrom(
            this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/mfa/verificar`, { codigo }),
        );

        this.guardarToken(respuesta.accessToken);
    }

    obtenerToken(): string | null {
        return this.tokenSignal();
    }

    tieneRol(...roles: string[]): boolean {
        const propios = this.roles();
        return roles.some((rol) => propios.includes(rol));
    }

    cerrarSesion(): void {
        localStorage.removeItem(CLAVE_TOKEN);
        this.tokenSignal.set(null);
        void this.router.navigate(['/login']);
    }

    private guardarToken(token: string): void {
        localStorage.setItem(CLAVE_TOKEN, token);
        this.tokenSignal.set(token);
    }

    private leerTokenGuardado(): string | null {
        return localStorage.getItem(CLAVE_TOKEN);
    }

    private decodificarToken(token: string): SesionUsuario | null {
        try {
            const [, payloadBase64] = token.split('.');
            if (payloadBase64 === undefined) {
                return null;
            }

            const payload = JSON.parse(atob(payloadBase64)) as {
                sub: string;
                username: string;
                roles: string[];
                mfaVerificado: boolean;
                exp: number;
            };

            if (payload.exp * 1000 < Date.now()) {
                return null;
            }

            return {
                id: payload.sub,
                username: payload.username,
                roles: payload.roles,
                mfaVerificado: payload.mfaVerificado,
            };
        } catch {
            return null;
        }
    }
}
