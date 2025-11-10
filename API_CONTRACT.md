# API Contract Documentation

## Overview
This document describes the API contracts for the optimized endpoints designed to handle 10,000+ items efficiently using compound indexes and lean queries.

## Base URL
```
/api
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Items API

### 1. Get Item by ID
**GET** `/api/items/:id`

Get a single item by MongoDB ObjectId.

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId

**Query Parameters:**
- `store_id` (string, optional): Store ID to get inventory data

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "item_code": "ITEM001",
    "barcode": "1234567890123",
    "name": "Basmati Rice 1kg",
    "brand": "Premium",
    "category_id": {
      "_id": "507f1f77bcf86cd799439012",
      "category_code": "CAT001",
      "name": "Groceries"
    },
    "sub_category_id": {
      "_id": "507f1f77bcf86cd799439013",
      "sub_category_code": "SUBCAT001",
      "name": "Rice & Grains"
    },
    "primary_supplier_id": {
      "_id": "507f1f77bcf86cd799439014",
      "supplier_code": "SUP001",
      "name": "ABC Suppliers Ltd"
    },
    "uom": "kg",
    "pack_size": "1kg",
    "tax_rate": 5,
    "mrp": 120,
    "purchase_price": 80,
    "selling_price": 100,
    "reorder_level": 50,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "inventory": {
      "qty_on_hand": 100,
      "qty_reserved": 0,
      "last_purchase_price": 80
    }
  }
}
```

**Index Used:** `_id` (primary key)

---

### 2. Get Item by Code (Canonical)
**GET** `/api/items/code/:item_code`

Get a single item by canonical item_code.

**Path Parameters:**
- `item_code` (string, required): Item code (case-insensitive, auto-uppercased)

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "item_code": "ITEM001",
    "barcode": "1234567890123",
    "name": "Basmati Rice 1kg",
    "brand": "Premium",
    "category_id": {
      "_id": "507f1f77bcf86cd799439012",
      "category_code": "CAT001",
      "name": "Groceries"
    },
    "sub_category_id": {
      "_id": "507f1f77bcf86cd799439013",
      "sub_category_code": "SUBCAT001",
      "name": "Rice & Grains"
    },
    "primary_supplier_id": {
      "_id": "507f1f77bcf86cd799439014",
      "supplier_code": "SUP001",
      "name": "ABC Suppliers Ltd"
    },
    "uom": "kg",
    "pack_size": "1kg",
    "tax_rate": 5,
    "mrp": 120,
    "purchase_price": 80,
    "selling_price": 100,
    "reorder_level": 50,
    "is_active": true
  }
}
```

**Index Used:** `item_code` (unique index)

---

### 3. Get Items (Paginated)
**GET** `/api/items`

Get paginated list of items optimized for 10,000+ items.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50, max: 100): Items per page
- `store_id` (string, required): Store ID for inventory data
- `category_id` (string, optional): Filter by category
- `sub_category_id` (string, optional): Filter by subcategory
- `is_active` (boolean, default: true): Filter by active status
- `search` (string, optional): Text search on name/brand
- `sort` (string, default: "name"): Sort field
- `sortOrder` (string, default: "asc"): Sort order (asc/desc)

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "item_code": "ITEM001",
        "barcode": "1234567890123",
        "name": "Basmati Rice 1kg",
        "brand": "Premium",
        "category_id": {
          "_id": "507f1f77bcf86cd799439012",
          "category_code": "CAT001",
          "name": "Groceries"
        },
        "sub_category_id": {
          "_id": "507f1f77bcf86cd799439013",
          "sub_category_code": "SUBCAT001",
          "name": "Rice & Grains"
        },
        "uom": "kg",
        "pack_size": "1kg",
        "tax_rate": 5,
        "mrp": 120,
        "purchase_price": 80,
        "selling_price": 100,
        "reorder_level": 50,
        "is_active": true,
        "inventory": {
          "qty_on_hand": 100,
          "qty_reserved": 0,
          "last_purchase_price": 80
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 200,
      "totalItems": 10000,
      "itemsPerPage": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Index Used:** Compound index `(category_id, sub_category_id, is_active, name text)`

**Sample Query:**
```javascript
// Get active items in category, sorted by name
GET /api/items?store_id=507f1f77bcf86cd799439015&category_id=507f1f77bcf86cd799439012&is_active=true&sort=name&sortOrder=asc&page=1&limit=50
```

---

## Sales API

### 1. Get Sales (Paginated)
**GET** `/api/sales`

Get paginated list of sales optimized for high-traffic queries.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50, max: 100): Items per page
- `store_id` (string, required): Filter by store
- `start_date` (string, optional): Start date (ISO format)
- `end_date` (string, optional): End date (ISO format)
- `customer_id` (string, optional): Filter by customer ID
- `item_id` (string, optional): Filter by item
- `sort` (string, default: "date"): Sort field
- `sortOrder` (string, default: "desc"): Sort order (asc/desc)

**Response:**
```json
{
  "status": "success",
  "data": {
    "sales": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "bill_id": "507f1f77bcf86cd799439021",
        "store_id": "507f1f77bcf86cd799439015",
        "item_id": "507f1f77bcf86cd799439011",
        "item_code": "ITEM001",
        "qty": 2,
        "price": 100,
        "discount": 5,
        "tax_rate": 5,
        "date": "2024-01-15T10:30:00.000Z",
        "item": {
          "_id": "507f1f77bcf86cd799439011",
          "item_code": "ITEM001",
          "name": "Basmati Rice 1kg",
          "brand": "Premium"
        },
        "bill": {
          "_id": "507f1f77bcf86cd799439021",
          "bill_no": "BILL001",
          "customer": {
            "customer_id": "CUST001",
            "name": "John Doe",
            "phone": "+919876543211"
          },
          "date": "2024-01-15T10:30:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 50,
      "totalSales": 2500,
      "itemsPerPage": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Index Used:** Compound index `(store_id, date, bill_id)`

**Sample Query:**
```javascript
// Get sales for store in date range
GET /api/sales?store_id=507f1f77bcf86cd799439015&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=50
```

---

### 2. Get Sales Summary
**GET** `/api/sales/summary`

Get aggregated sales summary for a date range.

**Query Parameters:**
- `store_id` (string, required): Filter by store
- `start_date` (string, optional): Start date (ISO format)
- `end_date` (string, optional): End date (ISO format)

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalSales": 1250,
    "totalQuantity": 5000,
    "totalRevenue": 500000,
    "totalDiscount": 25000,
    "avgPrice": 100
  }
}
```

**Index Used:** Compound index `(store_id, date)`

---

## Purchases API

### 1. Get Purchases (Paginated)
**GET** `/api/purchases`

Get paginated list of purchases optimized for high-traffic queries.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50, max: 100): Items per page
- `store_id` (string, required): Filter by store
- `supplier_id` (string, optional): Filter by supplier
- `start_date` (string, optional): Start date (ISO format)
- `end_date` (string, optional): End date (ISO format)
- `payment_status` (string, optional): Filter by payment status (pending/partial/paid/credit)
- `sort` (string, default: "date"): Sort field
- `sortOrder` (string, default: "desc"): Sort order (asc/desc)

**Response:**
```json
{
  "status": "success",
  "data": {
    "purchases": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "purchase_no": "PUR001",
        "supplier_id": {
          "_id": "507f1f77bcf86cd799439014",
          "supplier_code": "SUP001",
          "name": "ABC Suppliers Ltd"
        },
        "store_id": "507f1f77bcf86cd799439015",
        "date": "2024-01-10T09:00:00.000Z",
        "invoice_no": "INV001",
        "payment_status": "paid",
        "totals": {
          "subtotal": 400,
          "tax": 20,
          "discount": 0,
          "total": 420
        },
        "items": [
          {
            "_id": "507f1f77bcf86cd799439031",
            "item_id": "507f1f77bcf86cd799439011",
            "item_code": "ITEM001",
            "name": "Basmati Rice 1kg",
            "qty": 5,
            "purchase_price": 80,
            "tax_rate": 5,
            "discount": 0,
            "total": 400
          }
        ],
        "created_at": "2024-01-10T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 20,
      "totalPurchases": 1000,
      "itemsPerPage": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Index Used:** Compound index `(supplier_id, date)`

**Sample Query:**
```javascript
// Get purchases for supplier in date range
GET /api/purchases?store_id=507f1f77bcf86cd799439015&supplier_id=507f1f77bcf86cd799439014&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=50
```

---

### 2. Get Purchase by Number
**GET** `/api/purchases/number/:purchase_no`

Get a single purchase by purchase number.

**Path Parameters:**
- `purchase_no` (string, required): Purchase number (case-insensitive, auto-uppercased)

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "purchase_no": "PUR001",
    "supplier_id": {
      "_id": "507f1f77bcf86cd799439014",
      "supplier_code": "SUP001",
      "name": "ABC Suppliers Ltd",
      "phone": "+919876543210",
      "email": "contact@abcsuppliers.com"
    },
    "store_id": {
      "_id": "507f1f77bcf86cd799439015",
      "store_code": "STORE001",
      "name": "Main Store"
    },
    "date": "2024-01-10T09:00:00.000Z",
    "invoice_no": "INV001",
    "payment_status": "paid",
    "totals": {
      "subtotal": 400,
      "tax": 20,
      "discount": 0,
      "total": 420
    },
    "items": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "item_id": "507f1f77bcf86cd799439011",
        "item_code": "ITEM001",
        "name": "Basmati Rice 1kg",
        "qty": 5,
        "purchase_price": 80,
        "tax_rate": 5,
        "discount": 0,
        "total": 400,
        "item_details": {
          "_id": "507f1f77bcf86cd799439011",
          "item_code": "ITEM001",
          "name": "Basmati Rice 1kg",
          "brand": "Premium"
        }
      }
    ],
    "created_at": "2024-01-10T09:00:00.000Z",
    "updated_at": "2024-01-10T09:00:00.000Z",
    "created_by": {
      "_id": "507f1f77bcf86cd799439040",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**Index Used:** `purchase_no` (unique index)

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "status": "error",
  "message": "Error message description"
}
```

**HTTP Status Codes:**
- `400` - Bad Request (validation errors, missing required parameters)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

---

## Performance Notes

1. **Lean Queries**: All list endpoints use `.lean()` to return plain JavaScript objects instead of Mongoose documents, reducing memory usage and improving performance.

2. **Pagination**: All list endpoints support pagination with a maximum of 100 items per page to prevent large payloads.

3. **Index Usage**: All queries are optimized to use compound indexes for fast lookups.

4. **N+1 Prevention**: Related data (inventory, items, bills) is fetched in bulk and mapped to avoid N+1 query problems.

5. **Projection**: Only required fields are selected to minimize data transfer.

---

## Sample Queries That Hit Indexes

### Items
```javascript
// Uses compound index (category_id, sub_category_id, is_active, name text)
GET /api/items?store_id=507f1f77bcf86cd799439015&category_id=507f1f77bcf86cd799439012&is_active=true&search=rice&sort=name&sortOrder=asc
```

### Sales
```javascript
// Uses compound index (store_id, date, bill_id)
GET /api/sales?store_id=507f1f77bcf86cd799439015&start_date=2024-01-01&end_date=2024-01-31&sort=date&sortOrder=desc
```

### Purchases
```javascript
// Uses compound index (supplier_id, date)
GET /api/purchases?store_id=507f1f77bcf86cd799439015&supplier_id=507f1f77bcf86cd799439014&start_date=2024-01-01&end_date=2024-01-31
```


