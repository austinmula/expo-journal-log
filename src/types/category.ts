export interface Category {
  id: string;
  name: string;
  icon?: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}
