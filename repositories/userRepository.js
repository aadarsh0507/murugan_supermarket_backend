import { query } from '../db/index.js';

const sanitizeBoolean = (value) => value === 1 || value === true;

const mapUser = (row, stores = [], selectedStore = null) => {
    if (!row) return null;
    const {
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        role,
        department,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        address_country,
        preferences,
        is_active,
        last_login_at,
        reset_password_otp,
        reset_password_otp_expires_at,
        selected_store_id,
        created_at,
        updated_at
    } = row;

    return {
        _id: id,
        id,
        firstName,
        lastName,
        email,
        username,
        role,
        department,
        phone,
        address: {
            street: address_street,
            city: address_city,
            state: address_state,
            zipCode: address_zip_code,
            country: address_country
        },
        preferences: preferences ? JSON.parse(preferences) : undefined,
        isActive: sanitizeBoolean(is_active),
        lastLogin: last_login_at,
        resetPasswordOTP: reset_password_otp,
        resetPasswordOTPExpires: reset_password_otp_expires_at,
        selectedStore: selectedStore || (selected_store_id
            ? stores.find((store) => store._id === selected_store_id) || null
            : null),
        stores,
        created_at,
        updated_at
    };
};

export const findUserByEmail = async (email, { includePassword = false } = {}) => {
    const columns = includePassword ? '*' : 'id, first_name, last_name, email, username, role, department, phone, address_street, address_city, address_state, address_zip_code, address_country, preferences, is_active, last_login_at, reset_password_otp, reset_password_otp_expires_at, selected_store_id, created_at, updated_at';
    const rows = await query(`SELECT ${columns}${includePassword ? ', password_hash' : ''} FROM users WHERE email = ? LIMIT 1`, [email]);
    if (rows.length === 0) return null;

    const userRow = rows[0];
    const stores = await getStoresForUser(userRow.id);
    const selectedStore = userRow.selected_store_id ? await getStoreById(userRow.selected_store_id) : null;
    const mapped = mapUser(userRow, stores, selectedStore);
    if (includePassword) {
        mapped.password_hash = userRow.password_hash;
    }
    return mapped;
};

export const createUser = async (userData) => {
    const {
        firstName,
        lastName,
        email,
        username,
        passwordHash,
        role,
        department,
        phone,
        address,
        preferences,
        isActive = true,
        createdBy,
        selectedStoreId,
        stores = []
    } = userData;

    const result = await query(
        `INSERT INTO users (
      first_name, last_name, email, username, password_hash, role, department, phone,
      address_street, address_city, address_state, address_zip_code, address_country,
      preferences, is_active, created_by, selected_store_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            firstName,
            lastName || null,
            email,
            username,
            passwordHash,
            role,
            department,
            phone,
            address?.street || null,
            address?.city || null,
            address?.state || null,
            address?.zipCode || null,
            address?.country || 'India',
            preferences ? JSON.stringify(preferences) : null,
            isActive ? 1 : 0,
            createdBy || null,
            selectedStoreId || null
        ]
    );

    const userId = result.insertId;

    if (stores.length > 0) {
        await query(
            `INSERT INTO user_stores (user_id, store_id) VALUES ${stores.map(() => '(?, ?)').join(', ')}`,
            stores.flatMap((storeId) => [userId, storeId])
        );
    }

    return getUserById(userId);
};

export const getUserById = async (userId) => {
    const rows = await query(
        `SELECT id, first_name, last_name, email, username, role, department, phone,
      address_street, address_city, address_state, address_zip_code, address_country,
      preferences, is_active, last_login_at, reset_password_otp, reset_password_otp_expires_at,
      selected_store_id, created_at, updated_at
    FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );
    if (rows.length === 0) return null;

    const stores = await getStoresForUser(userId);
    const selectedStore = rows[0].selected_store_id ? await getStoreById(rows[0].selected_store_id) : null;
    return mapUser(rows[0], stores, selectedStore);
};

export const getStoresForUser = async (userId) => {
    const rows = await query(
        `SELECT s.id AS _id, s.id, s.name, s.store_code AS code, s.address_city AS city
     FROM stores s
     INNER JOIN user_stores us ON us.store_id = s.id
     WHERE us.user_id = ?`,
        [userId]
    );
    return rows.map((row) => ({
        _id: row.id,
        id: row.id,
        name: row.name,
        code: row.code,
        city: row.city
    }));
};

export const getStoreById = async (storeId) => {
    if (!storeId) return null;
    const rows = await query(
        `SELECT id AS _id, id, name, store_code AS code, address_street AS street,
      address_city AS city, address_state AS state, address_zip_code AS zipCode, address_country AS country
     FROM stores WHERE id = ? LIMIT 1`,
        [storeId]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        _id: row.id,
        id: row.id,
        name: row.name,
        code: row.code,
        address: {
            street: row.street,
            city: row.city,
            state: row.state,
            zipCode: row.zipCode,
            country: row.country
        }
    };
};

export const updateUserLastLogin = async (userId) => {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
    return getUserById(userId);
};

export const updateUserPassword = async (userId, passwordHash) => {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
};

export const saveResetPasswordOTP = async (userId, otp, expiresAt) => {
    await query(
        'UPDATE users SET reset_password_otp = ?, reset_password_otp_expires_at = ? WHERE id = ?',
        [otp, expiresAt, userId]
    );
};

export const clearResetPasswordOTP = async (userId) => {
    await query(
        'UPDATE users SET reset_password_otp = NULL, reset_password_otp_expires_at = NULL WHERE id = ?',
        [userId]
    );
};

export const verifyResetPasswordOTP = async (userId, otp) => {
    const rows = await query(
        `SELECT reset_password_otp, reset_password_otp_expires_at
     FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );

    if (rows.length === 0) return false;
    const { reset_password_otp, reset_password_otp_expires_at } = rows[0];
    if (!reset_password_otp || !reset_password_otp_expires_at) return false;
    if (reset_password_otp !== otp) return false;

    const expires = new Date(reset_password_otp_expires_at).getTime();
    return Date.now() <= expires;
};

export const listUsers = async ({
    page = 1,
    limit = 10,
    role,
    department,
    isActive
}) => {
    const offset = (page - 1) * limit;
    const filters = [];
    const params = [];

    if (role) {
        filters.push('role = ?');
        params.push(role);
    }
    if (department) {
        filters.push('department = ?');
        params.push(department);
    }
    if (isActive !== undefined) {
        filters.push('is_active = ?');
        params.push(isActive ? 1 : 0);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const users = await query(
        `SELECT id, first_name, last_name, email, username, role, department, phone,
      address_street, address_city, address_state, address_zip_code, address_country,
      preferences, is_active, last_login_at, selected_store_id, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const countRows = await query(
        `SELECT COUNT(*) AS total FROM users ${whereClause}`,
        params
    );

    const mappedUsers = await Promise.all(users.map(async (row) => {
        const stores = await getStoresForUser(row.id);
        const selectedStore = row.selected_store_id ? await getStoreById(row.selected_store_id) : null;
        return mapUser(row, stores, selectedStore);
    }));

    const total = countRows[0]?.total || 0;

    return {
        users: mappedUsers,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit) || 1,
            totalUsers: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

export const updateUser = async (userId, updates) => {
    if (updates.email) {
        const duplicate = await query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [updates.email, userId]);
        if (duplicate.length > 0) {
            const error = new Error('User with this email already exists');
            error.code = 'EMAIL_IN_USE';
            throw error;
        }
    }

    if (updates.username) {
        const duplicateUsername = await query('SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1', [updates.username, userId]);
        if (duplicateUsername.length > 0) {
            const error = new Error('User with this username already exists');
            error.code = 'USERNAME_IN_USE';
            throw error;
        }
    }

    const fields = [];
    const params = [];

    if (updates.firstName !== undefined) {
        fields.push('first_name = ?');
        params.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
        fields.push('last_name = ?');
        params.push(updates.lastName || null);
    }
    if (updates.email !== undefined) {
        fields.push('email = ?');
        params.push(updates.email);
    }
    if (updates.username !== undefined) {
        fields.push('username = ?');
        params.push(updates.username);
    }
    if (updates.role !== undefined) {
        fields.push('role = ?');
        params.push(updates.role);
    }
    if (updates.department !== undefined) {
        fields.push('department = ?');
        params.push(updates.department);
    }
    if (updates.phone !== undefined) {
        fields.push('phone = ?');
        params.push(updates.phone);
    }
    if (updates.address) {
        fields.push('address_street = ?', 'address_city = ?', 'address_state = ?', 'address_zip_code = ?', 'address_country = ?');
        params.push(
            updates.address.street || null,
            updates.address.city || null,
            updates.address.state || null,
            updates.address.zipCode || null,
            updates.address.country || 'India'
        );
    }
    if (updates.preferences !== undefined) {
        fields.push('preferences = ?');
        params.push(updates.preferences ? JSON.stringify(updates.preferences) : null);
    }
    if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        params.push(updates.isActive ? 1 : 0);
    }
    if (updates.selectedStoreId !== undefined) {
        fields.push('selected_store_id = ?');
        params.push(updates.selectedStoreId || null);
    }

    if (fields.length === 0) {
        return getUserById(userId);
    }

    params.push(userId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    if (updates.stores) {
        await query('DELETE FROM user_stores WHERE user_id = ?', [userId]);
        if (updates.stores.length > 0) {
            await query(
                `INSERT INTO user_stores (user_id, store_id) VALUES ${updates.stores.map(() => '(?, ?)').join(', ')}`,
                updates.stores.flatMap((storeId) => [userId, storeId])
            );
        }
    }

    return getUserById(userId);
};

