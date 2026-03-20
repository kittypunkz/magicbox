// backend/src/types/auth.ts
// Only JWT-related types, NOT UserContext or PaginatedResponse

export interface JWTPayload {
  sub: string;        // user ID
  username: string;
  iat: number;
  exp: number;
}

export interface TokenResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
    };
  };
  error?: string;
}
