import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';
import { CategoryRow } from '@/types/database';

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
  };
}

class CategoryRepository {
  private static instance: CategoryRepository;

  static getInstance(): CategoryRepository {
    if (!CategoryRepository.instance) {
      CategoryRepository.instance = new CategoryRepository();
    }
    return CategoryRepository.instance;
  }

  async getAll(): Promise<Category[]> {
    const db = databaseService.getDatabase();

    const rows = await db.getAllAsync<CategoryRow>(
      `SELECT * FROM categories ORDER BY sort_order ASC, name ASC`
    );

    return rows.map(mapRowToCategory);
  }

  async getById(id: string): Promise<Category | null> {
    const db = databaseService.getDatabase();

    const row = await db.getFirstAsync<CategoryRow>(
      `SELECT * FROM categories WHERE id = ?`,
      [id]
    );

    if (!row) {
      return null;
    }

    return mapRowToCategory(row);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const db = databaseService.getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get next sort order if not provided
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
        'SELECT MAX(sort_order) as max_order FROM categories'
      );
      sortOrder = (maxOrder?.max_order ?? -1) + 1;
    }

    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.name.trim(), input.icon || null, input.color, sortOrder, now]
    );

    const category = await this.getById(id);
    if (!category) {
      throw new Error('Failed to create category');
    }

    return category;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const db = databaseService.getDatabase();

    const existingCategory = await this.getById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name.trim());
    }

    if (input.icon !== undefined) {
      updates.push('icon = ?');
      values.push(input.icon || null);
    }

    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color);
    }

    if (input.sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(input.sortOrder);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updatedCategory = await this.getById(id);
    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return updatedCategory;
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();

    // First, set category_id to null for all entries using this category
    await db.runAsync(
      'UPDATE entries SET category_id = NULL WHERE category_id = ?',
      [id]
    );

    // Then delete the category
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }

  async getByName(name: string): Promise<Category | null> {
    const db = databaseService.getDatabase();

    const row = await db.getFirstAsync<CategoryRow>(
      `SELECT * FROM categories WHERE LOWER(name) = LOWER(?)`,
      [name.trim()]
    );

    if (!row) {
      return null;
    }

    return mapRowToCategory(row);
  }

  async reorder(categoryIds: string[]): Promise<void> {
    const db = databaseService.getDatabase();

    for (let i = 0; i < categoryIds.length; i++) {
      await db.runAsync(
        'UPDATE categories SET sort_order = ? WHERE id = ?',
        [i, categoryIds[i]]
      );
    }
  }
}

export const categoryRepository = CategoryRepository.getInstance();
