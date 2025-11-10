import { query } from '../db/index.js';

const mapStore = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        code: row.store_code,
        phone: row.phone,
        email: row.email,
        address: {
            street: row.address_street,
            city: row.address_city,
            state: row.address_state,
            zipCode: row.address_zip_code,
            country: row.address_country
        },
        isActive: row.is_active === 1 || row.is_active === true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

const getNextStoreCode = async () => {
    const [row] = await query(
        `SELECT MAX(
        CASE
          WHEN store_code REGEXP '^[0-9]+$' THEN CAST(store_code AS UNSIGNED)
          ELSE 0
        END
      ) AS maxCode
     FROM stores`
    );

    const nextCode = (Number(row?.maxCode) || 0) + 1;
    return String(nextCode);
};

export const listStores = async ({ search, isActive } = {}) => {
    const filters = [];
    const params = [];

    if (search) {
        filters.push('(name LIKE ? OR store_code LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term);
    }

    if (isActive !== undefined) {
        filters.push('is_active = ?');
        params.push(isActive ? 1 : 0);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await query(
        `SELECT id, name, store_code, phone, email, address_street, address_city,
            address_state, address_zip_code, address_country, is_active,
            created_at, updated_at
     FROM stores
     ${whereClause}
     ORDER BY name ASC`,
        params
    );

    return rows.map(mapStore);
};

export const getStoreById = async (storeId) => {
    const rows = await query(
        `SELECT id, name, store_code, phone, email, address_street, address_city,
            address_state, address_zip_code, address_country, is_active,
            created_at, updated_at
     FROM stores
     WHERE id = ?
     LIMIT 1`,
        [storeId]
    );

    if (rows.length === 0) return null;
    return mapStore(rows[0]);
};

export const createStore = async ({
    name,
    phone,
    email,
    address,
    isActive = true,
    createdBy
}) => {
    const storeCode = await getNextStoreCode();

    const result = await query(
        `INSERT INTO stores (
      name, store_code, phone, email,
      address_street, address_city, address_state, address_zip_code, address_country,
      is_active, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            name,
            storeCode,
            phone || null,
            email || null,
            address?.street || null,
            address?.city || null,
            address?.state || null,
            address?.zipCode || null,
            address?.country || 'India',
            isActive ? 1 : 0,
            createdBy || null
        ]
    );

    return getStoreById(result.insertId);
};

export const updateStore = async (storeId, updates) => {
    const fields = [];
    const params = [];

    if (updates.name !== undefined) {
        fields.push('name = ?');
        params.push(updates.name);
    }
    if (updates.code !== undefined) {
        fields.push('store_code = ?');
        params.push(updates.code);
    }
    if (updates.phone !== undefined) {
        fields.push('phone = ?');
        params.push(updates.phone || null);
    }
    if (updates.email !== undefined) {
        fields.push('email = ?');
        params.push(updates.email || null);
    }
    if (updates.address) {
        fields.push(
            'address_street = ?',
            'address_city = ?',
            'address_state = ?',
            'address_zip_code = ?',
            'address_country = ?'
        );
        params.push(
            updates.address.street || null,
            updates.address.city || null,
            updates.address.state || null,
            updates.address.zipCode || null,
            updates.address.country || 'India'
        );
    }
    if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        params.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
        return getStoreById(storeId);
    }

    fields.push('updated_at = NOW()');

    params.push(storeId);
    await query(`UPDATE stores SET ${fields.join(', ')} WHERE id = ?`, params);

    return getStoreById(storeId);
};

export const deleteStore = async (storeId) => {
    const [{ supplierCount }] = await query(
        'SELECT COUNT(*) AS supplierCount FROM supplier_stores WHERE store_id = ?',
        [storeId]
    );
    if (supplierCount > 0) {
        const error = new Error('Cannot delete store that is associated with suppliers');
        error.code = 'STORE_HAS_SUPPLIERS';
        throw error;
    }

    await query('DELETE FROM stores WHERE id = ?', [storeId]);
};

