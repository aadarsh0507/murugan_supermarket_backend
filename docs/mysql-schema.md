# MySQL Schema Overview

This document outlines the relational schema that mirrors the entities currently defined with Mongoose models. It is intended to drive both the backend rewrite and any frontend work that depends on field-level metadata.

## Conventions
- All tables use `BIGINT` auto-increment primary keys except where noted.
- Timestamps use `DATETIME` with default `CURRENT_TIMESTAMP`.
- JSON columns rely on MySQL 5.7+/8.0 features.
- Boolean fields are stored as `TINYINT(1)`.
- Foreign keys use `ON UPDATE CASCADE` and `ON DELETE RESTRICT` unless otherwise stated.

## Tables

### `users`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| first_name | VARCHAR(50) | NOT NULL | |
| last_name | VARCHAR(50) | NOT NULL | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Lowercase enforced in app |
| username | VARCHAR(100) | UNIQUE | Defaults to email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| role | ENUM('admin','manager','staff','cashier') | NOT NULL DEFAULT 'staff' | |
| department | ENUM('management','sales','inventory','billing','reports') | DEFAULT 'sales' | |
| phone | VARCHAR(20) | NULL | E.164 validated |
| address_street | VARCHAR(200) | NULL | |
| address_city | VARCHAR(50) | NULL | |
| address_state | VARCHAR(50) | NULL | |
| address_zip_code | VARCHAR(10) | NULL | |
| address_country | VARCHAR(50) | NULL | Defaults to 'India' |
| preferences | JSON | NULL | Stores theme/language/notifications |
| is_active | TINYINT(1) | NOT NULL DEFAULT 1 | Soft delete flag |
| last_login_at | DATETIME | NULL | |
| reset_password_otp | VARCHAR(10) | NULL | |
| reset_password_otp_expires_at | DATETIME | NULL | |
| selected_store_id | BIGINT UNS | FK → stores(id) ON DELETE SET NULL | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |
| created_by | BIGINT UNS | FK → users(id) | Self reference |

#### Join Table: `user_stores`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT UNS | PK, FK → users(id) |
| store_id | BIGINT UNS | PK, FK → stores(id) |
| assigned_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `stores`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| store_code | VARCHAR(20) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| address_street | VARCHAR(200) | NULL |
| address_city | VARCHAR(50) | NULL |
| address_state | VARCHAR(50) | NULL |
| address_zip_code | VARCHAR(10) | NULL |
| address_country | VARCHAR(50) | DEFAULT 'India' |
| phone | VARCHAR(20) | NULL |
| email | VARCHAR(255) | NULL |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| category_code | VARCHAR(50) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `sub_categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| sub_category_code | VARCHAR(50) | NOT NULL, UNIQUE |
| category_id | BIGINT UNS | NOT NULL, FK → categories(id) |
| name | VARCHAR(100) | NOT NULL |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `suppliers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| supplier_code | VARCHAR(50) | NOT NULL, UNIQUE |
| name | VARCHAR(200) | NOT NULL |
| phone | VARCHAR(20) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| gstin | VARCHAR(15) | NULL |
| address_street | VARCHAR(200) | NULL |
| address_city | VARCHAR(50) | NULL |
| address_state | VARCHAR(50) | NULL |
| address_zip_code | VARCHAR(10) | NULL |
| address_country | VARCHAR(50) | DEFAULT 'India' |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| item_code | VARCHAR(50) | NOT NULL, UNIQUE |
| barcode | VARCHAR(50) | UNIQUE, NULL | |
| name | VARCHAR(200) | NOT NULL |
| brand | VARCHAR(100) | NULL |
| category_id | BIGINT UNS | NOT NULL, FK → categories(id) |
| sub_category_id | BIGINT UNS | NOT NULL, FK → sub_categories(id) |
| primary_supplier_id | BIGINT UNS | NULL, FK → suppliers(id) |
| uom | ENUM('pcs','kg','g','l','ml','box','pack','dozen','other') | NOT NULL |
| pack_size | VARCHAR(50) | NULL |
| tax_rate | DECIMAL(5,2) | NOT NULL |
| mrp | DECIMAL(10,2) | NOT NULL |
| purchase_price | DECIMAL(10,2) | NOT NULL |
| selling_price | DECIMAL(10,2) | NOT NULL |
| reorder_level | INT UNS | NOT NULL DEFAULT 0 |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `inventories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| item_id | BIGINT UNS | NOT NULL, FK → items(id) |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| qty_on_hand | INT UNS | NOT NULL DEFAULT 0 |
| qty_reserved | INT UNS | NOT NULL DEFAULT 0 |
| last_purchase_price | DECIMAL(10,2) | NULL |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

Unique constraint `(item_id, store_id)` ensures one inventory row per item/store pair.

### `bills`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| bill_no | VARCHAR(50) | NOT NULL, UNIQUE |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| user_id | BIGINT UNS | NOT NULL, FK → users(id) |
| date | DATETIME | NOT NULL |
| customer_id | VARCHAR(50) | NULL |
| customer_name | VARCHAR(100) | NULL |
| customer_phone | VARCHAR(20) | NULL |
| customer_email | VARCHAR(255) | NULL |
| payment_method | ENUM('cash','card','upi','credit','other') | NOT NULL DEFAULT 'cash' |
| payment_status | ENUM('pending','partial','paid','refunded') | NOT NULL DEFAULT 'paid' |
| subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| tax | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| discount | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| total | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `sales`
Represents bill line items.

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| bill_id | BIGINT UNS | NOT NULL, FK → bills(id) |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| item_id | BIGINT UNS | NOT NULL, FK → items(id) |
| item_code | VARCHAR(50) | NOT NULL |
| qty | INT UNS | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| discount | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| tax_rate | DECIMAL(5,2) | NOT NULL DEFAULT 0 |
| date | DATETIME | NOT NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `purchases`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| purchase_no | VARCHAR(50) | NOT NULL, UNIQUE |
| supplier_id | BIGINT UNS | NOT NULL, FK → suppliers(id) |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| date | DATETIME | NOT NULL |
| invoice_no | VARCHAR(50) | NULL |
| payment_status | ENUM('pending','partial','paid','credit') | NOT NULL DEFAULT 'pending' |
| subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| tax | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| discount | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| total | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

#### `purchase_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| purchase_id | BIGINT UNS | NOT NULL, FK → purchases(id) |
| item_id | BIGINT UNS | NOT NULL, FK → items(id) |
| item_code | VARCHAR(50) | NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| qty | INT UNS | NOT NULL |
| purchase_price | DECIMAL(10,2) | NOT NULL |
| tax_rate | DECIMAL(5,2) | NOT NULL DEFAULT 0 |
| discount | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| total | DECIMAL(12,2) | NOT NULL |

### `purchase_returns`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| return_no | VARCHAR(50) | NOT NULL, UNIQUE |
| original_purchase_id | BIGINT UNS | NOT NULL, FK → purchases(id) |
| supplier_id | BIGINT UNS | NOT NULL, FK → suppliers(id) |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| date | DATETIME | NOT NULL |
| reason | VARCHAR(500) | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

#### `purchase_return_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| purchase_return_id | BIGINT UNS | NOT NULL, FK → purchase_returns(id) |
| item_id | BIGINT UNS | NOT NULL, FK → items(id) |
| item_code | VARCHAR(50) | NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| qty | INT UNS | NOT NULL |
| purchase_price | DECIMAL(10,2) | NOT NULL |
| reason | VARCHAR(255) | NULL |

### `credits`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| bill_id | BIGINT UNS | NOT NULL, FK → bills(id) |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| amount | DECIMAL(12,2) | NOT NULL |
| reason | VARCHAR(500) | NULL |
| status | ENUM('pending','partial','paid','cancelled') | NOT NULL DEFAULT 'pending' |
| date | DATETIME | NOT NULL |
| customer_id | VARCHAR(50) | NULL |
| customer_name | VARCHAR(100) | NULL |
| customer_phone | VARCHAR(20) | NULL |
| customer_email | VARCHAR(255) | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

### `stock_movements`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNS | PK, AUTO_INCREMENT |
| store_id | BIGINT UNS | NOT NULL, FK → stores(id) |
| item_id | BIGINT UNS | NOT NULL, FK → items(id) |
| item_code | VARCHAR(50) | NOT NULL |
| type | ENUM('in','out','transfer','adjustment','return') | NOT NULL |
| qty_change | INT | NOT NULL | Can be negative |
| reference_type | ENUM('purchase','purchase_return','sale','bill','manual') | NULL |
| reference_id | BIGINT UNS | NULL | FK depends on reference_type |
| note | VARCHAR(500) | NULL |
| date | DATETIME | NOT NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| created_by | BIGINT UNS | FK → users(id) |

## Index Highlights
- `users`: unique indexes on email and username, index on role/is_active for admin filters.
- `items`: indexes on category, subcategory, supplier, `item_code`, and `barcode`.
- `inventories`: unique `(item_id, store_id)` plus indexes on `store_id` and `item_code`.
- `purchases`: composite index `(supplier_id, date)` for reporting.
- `sales`: composite index `(store_id, date, bill_id)` for dashboards.
- `credits`: composite index `(store_id, status, date)` and on customer_id for lookups.

## Sample DDL Snippet
Below is an illustrative DDL for two core tables. The full migration script can be generated from this specification.

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','manager','staff','cashier') NOT NULL DEFAULT 'staff',
  department ENUM('management','sales','inventory','billing','reports') DEFAULT 'sales',
  phone VARCHAR(20),
  address_street VARCHAR(200),
  address_city VARCHAR(50),
  address_state VARCHAR(50),
  address_zip_code VARCHAR(10),
  address_country VARCHAR(50) DEFAULT 'India',
  preferences JSON,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME,
  reset_password_otp VARCHAR(10),
  reset_password_otp_expires_at DATETIME,
  selected_store_id BIGINT UNSIGNED,
  created_by BIGINT UNSIGNED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_selected_store FOREIGN KEY (selected_store_id) REFERENCES stores(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE user_stores (
  user_id BIGINT UNSIGNED NOT NULL,
  store_id BIGINT UNSIGNED NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, store_id),
  CONSTRAINT fk_user_stores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_stores_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

---

**Next steps:** once this schema is approved, we can implement migration scripts (e.g., using SQL files or a migration tool) and start rewriting the backend data layer to execute against MySQL using `MYSQL_URL`.
