export interface AuthUser {
  id: string;
  email?: string;
}

export interface PaginatedQuery {
  limit?: number;
  offset?: number;
}
