import { query } from '../db/index.js';

const mapBill = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    billNo: row.bill_no,
    storeId: row.store_id,
    userId: row.user_id,
    date: row.date,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal ?? 0),
    tax: Number(row.tax ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const getBillById = async (billId) => {
  const rows = await query(
    `SELECT id, bill_no, store_id, user_id, date, customer_id, customer_name, customer_phone,
            customer_email, payment_method, payment_status, subtotal, tax, discount, total,
            created_at, updated_at
     FROM bills
     WHERE id = ?
     LIMIT 1`,
    [billId]
  );
  if (rows.length === 0) return null;
  return mapBill(rows[0]);
};

export const createBill = async ({
  billNo,
  storeId,
  userId,
  date,
  customerId,
  customerName,
  customerPhone,
  customerEmail,
  paymentMethod,
  paymentStatus,
  subtotal = 0,
  tax = 0,
  discount = 0,
  total = 0
}) => {
  const result = await query(
    `INSERT INTO bills (
      bill_no, store_id, user_id, date,
      customer_id, customer_name, customer_phone, customer_email,
      payment_method, payment_status, subtotal, tax, discount, total,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      billNo,
      storeId,
      userId,
      date,
      customerId || null,
      customerName || null,
      customerPhone || null,
      customerEmail || null,
      paymentMethod || 'cash',
      paymentStatus || 'paid',
      subtotal,
      tax,
      discount,
      total
    ]
  );

  return getBillById(result.insertId);
};

export const deleteBill = async (billId) => {
  const existing = await getBillById(billId);
  if (!existing) {
    return null;
  }

  await query('DELETE FROM bills WHERE id = ?', [billId]);
  return existing;
};

