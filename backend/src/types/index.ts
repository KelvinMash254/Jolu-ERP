import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  roleDisplayName: string;
  permissions: { module: string; action: string }[];
  companies: { id: string; code: string; name: string; isPrimary: boolean }[];
  branches: { id: string; code: string; name: string }[];
  sessionId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
