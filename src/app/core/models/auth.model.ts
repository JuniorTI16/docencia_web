export interface RespuestaLogin {
    accessToken: string;
    requiereMfa: boolean;
}

export interface SesionUsuario {
    id: string;
    username: string;
    roles: string[];
    mfaVerificado: boolean;
}
