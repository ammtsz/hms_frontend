export enum SystemOptionType {
  BODY_LOCATION = 'body_location',
  COLOR = 'color',
  PRIORITY = 'priority',
  NOTE_CATEGORY = 'note_category',
}

export interface SystemOption {
  id: number;
  type: SystemOptionType;
  value: string;
  label?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemOptionRequest {
  type: SystemOptionType;
  value: string;
  label?: string | null;
  sortOrder?: number | null;
}

export interface UpdateSystemOptionRequest {
  value?: string;
  isActive?: boolean;
  label?: string | null;
  sortOrder?: number | null;
}

export interface SimilarOption {
  id: number;
  value: string;
  similarity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  value?: T;
  error?: string;
}
