// import { query } from '../db/index.js';

// const mapItem = (row) => {
//   if (!row) return null;
//   return {
//     id: row.id,
//     itemCode: row.item_code,
//     name: row.name,
//     description: row.description,
//     brand: row.brand,
//     categoryId: row.category_id,
//     subcategoryId: row.subcategory_id,
//     unit: row.unit,
//     costPrice: Number(row.cost_price),
//     sellingPrice: Number(row.selling_price),
//     mrp: Number(row.mrp),
//     reorderLevel: row.reorder_level,
//     gstRate: row.gst_rate,
//     hsnCode: row.hsn_code,
//     barcode: row.barcode,
//     notes: row.notes,
//     isActive: row.is_active === 1 || row.is_active === true,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at
//   };
// };

// export const listItems = async ({
//   search,
//   categoryId,
//   subcategoryId,
//   isActive,
//   limit = 50,
//   offset = 0
// } = {}) => {
//   const filters = [];
//   const params = [];

//   if (search) {
//     filters.push('(name LIKE ? OR item_code LIKE ? OR barcode LIKE ?)');
//     params.push(`%${search}%`, `%${search}%`, `%${search}%`);
//   }

//   if (categoryId) {
//     filters.push('category_id = ?');
//     params.push(categoryId);
//   }

//   if (subcategoryId) {
//     filters.push('subcategory_id = ?');
//     params.push(subcategoryId);
//   }

//   if (isActive !== undefined) {
//     filters.push('is_active = ?');
//     params.push(isActive ? 1 : 0);
//   }

//   const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

//   const rows = await query(
//     `SELECT id, item_code, name, description, brand, category_id, subcategory_id,
//             unit, cost_price, selling_price, mrp, reorder_level, gst_rate, hsn_code,
//             barcode, notes, is_active, created_at, updated_at
//      FROM items
//      ${whereClause}
//      ORDER BY created_at DESC
//      LIMIT ? OFFSET ?`,
//     [...params, limit, offset]
//   );

//   const countRows = await query(
//     `SELECT COUNT(*) AS total FROM items ${whereClause}`,
//     params
//   );

//   return {
//     items: rows.map(mapItem),
//     total: countRows[0]?.total || 0
//   };
// };

// export const getItemById = async (itemId) => {
//   const rows = await query(
//     `SELECT id, item_code, name, description, brand, category_id, subcategory_id,
//             unit, cost_price, selling_price, mrp, reorder_level, gst_rate, hsn_code,
//             barcode, notes, is_active, created_at, updated_at
//      FROM items
//      WHERE id = ?
//      LIMIT 1`,
//     [itemId]
//   );

//   if (rows.length === 0) return null;
//   return mapItem(rows[0]);
// };

// export const createItem = async (itemData) => {
//   const {
//     itemCode,
//     name,
//     description,
//     brand,
//     categoryId,
//     subcategoryId,
//     unit,
//     costPrice,
//     sellingPrice,
//     mrp,
//     reorderLevel,
//     gstRate,
//     hsnCode,
//     barcode,
//     notes,
//     isActive = true
//   } = itemData;

//   const result = await query(
//     `INSERT INTO items (
//       item_code, name, description, brand, category_id, subcategory_id,
//       unit, cost_price, selling_price, mrp, reorder_level,
//       gst_rate, hsn_code, barcode, notes, is_active
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       itemCode,
//       name,
//       description || null,
//       brand || null,
//       categoryId || null,
//       subcategoryId || null,
//       unit || null,
//       costPrice || 0,
//       sellingPrice || 0,
//       mrp || 0,
//       reorderLevel || 0,
//       gstRate || 0,
//       hsnCode || null,
//       barcode || null,
//       notes || null,
//       isActive ? 1 : 0
//     ]
//   );

//   return getItemById(result.insertId);
// };

// export const updateItem = async (itemId, updates) => {
//   const fields = [];
//   const params = [];

//   if (updates.itemCode !== undefined) {
//     fields.push('item_code = ?');
//     params.push(updates.itemCode);
//   }
//   if (updates.name !== undefined) {
//     fields.push('name = ?');
//     params.push(updates.name);
//   }
//   if (updates.description !== undefined) {
//     fields.push('description = ?');
//     params.push(updates.description || null);
//   }
//   if (updates.brand !== undefined) {
//     fields.push('brand = ?');
//     params.push(updates.brand || null);
//   }
//   if (updates.categoryId !== undefined) {
//     fields.push('category_id = ?');
//     params.push(updates.categoryId || null);
//   }
//   if (updates.subcategoryId !== undefined) {
//     fields.push('subcategory_id = ?');
//     params.push(updates.subcategoryId || null);
//   }
//   if (updates.unit !== undefined) {
//     fields.push('unit = ?');
//     params.push(updates.unit || null);
//   }
//   if (updates.costPrice !== undefined) {
//     fields.push('cost_price = ?');
//     params.push(updates.costPrice || 0);
//   }
//   if (updates.sellingPrice !== undefined) {
//     fields.push('selling_price = ?');
//     params.push(updates.sellingPrice || 0);
//   }
//   if (updates.mrp !== undefined) {
//     fields.push('mrp = ?');
//     params.push(updates.mrp || 0);
//   }
//   if (updates.reorderLevel !== undefined) {
//     fields.push('reorder_level = ?');
//     params.push(updates.reorderLevel || 0);
//   }
//   if (updates.gstRate !== undefined) {
//     fields.push('gst_rate = ?');
//     params.push(updates.gstRate || 0);
//   }
//   if (updates.hsnCode !== undefined) {
//     fields.push('hsn_code = ?');
//     params.push(updates.hsnCode || null);
//   }
//   if (updates.barcode !== undefined) {
//     fields.push('barcode = ?');
//     params.push(updates.barcode || null);
//   }
//   if (updates.notes !== undefined) {
//     fields.push('notes = ?');
//     params.push(updates.notes || null);
//   }
//   if (updates.isActive !== undefined) {
//     fields.push('is_active = ?');
//     params.push(updates.isActive ? 1 : 0);
//   }

//   if (fields.length === 0) {
//     return getItemById(itemId);
//   }

//   params.push(itemId);
//   await query(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, params);

//   return getItemById(itemId);
// };

// export const deleteItem = async (itemId) => {
//   await query('DELETE FROM items WHERE id = ?', [itemId]);
// };


