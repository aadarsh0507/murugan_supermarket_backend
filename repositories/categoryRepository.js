// import { query } from '../db/index.js';

// const mapCategory = (row) => {
//   if (!row) return null;
//   return {
//     id: row.id,
//     name: row.name,
//     slug: row.slug,
//     description: row.description,
//     isActive: row.is_active === 1 || row.is_active === true,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at
//   };
// };

// export const listCategories = async ({ search, isActive } = {}) => {
//   const filters = [];
//   const params = [];

//   if (search) {
//     filters.push('(name LIKE ? OR slug LIKE ?)');
//     params.push(`%${search}%`, `%${search}%`);
//   }

//   if (isActive !== undefined) {
//     filters.push('is_active = ?');
//     params.push(isActive ? 1 : 0);
//   }

//   const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

//   const rows = await query(
//     `SELECT id, name, slug, description, is_active, created_at, updated_at
//      FROM categories
//      ${whereClause}
//      ORDER BY name ASC`,
//     params
//   );

//   return rows.map(mapCategory);
// };

// export const getCategoryById = async (categoryId) => {
//   const rows = await query(
//     `SELECT id, name, slug, description, is_active, created_at, updated_at
//      FROM categories
//      WHERE id = ?
//      LIMIT 1`,
//     [categoryId]
//   );

//   if (rows.length === 0) return null;
//   return mapCategory(rows[0]);
// };

// export const createCategory = async ({ name, slug, description, isActive = true }) => {
//   const result = await query(
//     `INSERT INTO categories (name, slug, description, is_active)
//      VALUES (?, ?, ?, ?)`,
//     [name, slug, description || null, isActive ? 1 : 0]
//   );

//   return getCategoryById(result.insertId);
// };

// export const updateCategory = async (categoryId, updates) => {
//   const fields = [];
//   const params = [];

//   if (updates.name !== undefined) {
//     fields.push('name = ?');
//     params.push(updates.name);
//   }
//   if (updates.slug !== undefined) {
//     fields.push('slug = ?');
//     params.push(updates.slug);
//   }
//   if (updates.description !== undefined) {
//     fields.push('description = ?');
//     params.push(updates.description || null);
//   }
//   if (updates.isActive !== undefined) {
//     fields.push('is_active = ?');
//     params.push(updates.isActive ? 1 : 0);
//   }

//   if (fields.length === 0) {
//     return getCategoryById(categoryId);
//   }

//   params.push(categoryId);
//   await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);

//   return getCategoryById(categoryId);
// };

// export const deleteCategory = async (categoryId) => {
//   await query('DELETE FROM categories WHERE id = ?', [categoryId]);
// };


