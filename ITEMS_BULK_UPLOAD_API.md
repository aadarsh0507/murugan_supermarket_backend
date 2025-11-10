# Bulk Upload Items API

## Endpoint

**POST** `/api/items/bulk-upload`

## Description

Upload multiple items from a CSV file. This endpoint allows you to bulk import item data into the system.

## Authentication

Required: Yes (Admin or Manager role)

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Request

### Method

- **POST** - Upload CSV file with item data

### Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Body (Form Data)

- **file**: CSV file containing item data (required)

### CSV File Format

The CSV file must have the following columns (case-sensitive):

#### Required Fields

- `name` - Item name
- `sku` - Stock Keeping Unit (must be unique). Also accepts: `SKU`, `itemCode`, `code`
- `price` - Selling price (numeric). Also accepts: `sellingPrice`
- `unit` - Unit of measurement (e.g., "kg", "pieces", "liters"). Also accepts: `measurementUnit`, `uom`
- `subcategory` - Subcategory name or ID (must be a level 2 category). Also accepts: `category`, `categoryId`, `subcategoryId`

#### Optional Fields

- `description` - Item description. Also accepts: `desc`
- `cost` - Purchase/cost price (numeric). Also accepts: `purchasePrice`, `buyingPrice`
- `stock` - Current stock quantity (numeric, defaults to 0). Also accepts: `quantity`, `qty`
- `minStock` - Minimum stock level (numeric, defaults to 0). Also accepts: `minStockLevel`, `minimumStock`
- `maxStock` - Maximum stock level (numeric). Also accepts: `maxStockLevel`, `maximumStock`
- `weight` - Weight in kg or appropriate unit (numeric)
- `length` - Length dimension (numeric)
- `width` - Width dimension (numeric)
- `height` - Height dimension (numeric)
- `barcode` - Barcode (must be unique if provided). Also accepts: `barCode`
- `tags` - Comma-separated tags (e.g., "organic,premium,popular"). Also accepts: `tag`
- `isActive` - Active status (true/false/1/0/yes/no, defaults to true). Also accepts: `active`
- `isDigital` - Digital product flag (true/false/1/0/yes/no, defaults to false). Also accepts: `digital`
- `requiresPrescription` - Prescription required flag (true/false/1/0/yes/no, defaults to false). Also accepts: `prescription`, `rx`
- `expiryDate` - Expiry date (ISO date format). Also accepts: `expiry`, `expDate`

### Sample CSV

```csv
name,sku,description,subcategory,price,cost,stock,minStock,maxStock,unit,weight,barcode,tags,isActive
Apple iPhone 15,IPH15-128GB,Latest iPhone with 128GB storage,Electronics,89999,75000,50,10,200,pieces,187,1234567890123,smartphone,premium,true
Samsung Galaxy S24,SAM-S24-256,Flagship Android smartphone,Electronics,74999,62000,30,5,150,pieces,168,1234567890124,android,smartphone,true
Organic Bananas,BAN-ORG-1KG,Fresh organic bananas,Food & Beverages,89.99,65.00,100,20,500,kg,1,,organic,fruits,true
```

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Bulk upload completed. 3 item(s) created successfully.",
  "data": {
    "totalRows": 3,
    "successCount": 3,
    "errorCount": 0,
    "items": [
      {
        "_id": "...",
        "name": "Apple iPhone 15",
        "sku": "IPH15-128GB",
        "price": 89999,
        ...
      }
    ],
    "errors": []
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "No valid items found in CSV file",
  "errors": [
    {
      "row": 2,
      "error": "Missing required fields (name, sku, price, unit)",
      "data": { ... }
    },
    {
      "row": 3,
      "error": "Subcategory not found: Electronics. Subcategory must be a level 2 category.",
      "data": { ... }
    }
  ]
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Server error while processing bulk upload",
  "error": "Error details (only in development mode)"
}
```

## Validation Rules

1. **SKU Uniqueness**

   - Each SKU must be unique within the database
   - No duplicate SKUs allowed in the CSV file
   - Existing items with the same SKU will be skipped

2. **Barcode Uniqueness**

   - Each barcode must be unique if provided
   - No duplicate barcodes allowed in the CSV file
   - Existing items with the same barcode will be skipped

3. **Required Fields**

   - `name` - Cannot be empty
   - `sku` - Must be unique and non-empty
   - `price` - Must be a valid positive number
   - `unit` - Cannot be empty
   - `subcategory` - Must be a valid level 2 category (can be ID or name)

4. **Subcategory Lookup**

   - Subcategory can be provided as MongoDB ObjectId or category name
   - The system will look up by name (case-insensitive) or by ID
   - Only level 2 categories (subcategories) are accepted for items

5. **Numeric Fields**

   - `price`, `cost` - Must be positive numbers
   - `stock`, `minStock`, `maxStock` - Must be non-negative integers
   - `weight`, `length`, `width`, `height` - Must be positive numbers

6. **Boolean Fields**

   - Accepts: `true`, `1`, `yes`, `y` for true
   - Accepts: `false`, `0`, `no`, `n` for false
   - Defaults:
     - `isActive`: true
     - `isDigital`: false
     - `requiresPrescription`: false

7. **Tags**

   - Comma-separated string (e.g., "tag1,tag2,tag3")
   - Maximum 10 tags per item
   - Empty tags are automatically filtered

8. **Date Fields**
   - `expiryDate` - Must be in ISO date format or a valid date string

## Testing with Postman

### Steps:

1. **Import Environment or Set Variables**

   - `base_url`: `http://localhost:5000` (or your server URL)
   - `token`: Your JWT authentication token

2. **Create a New Request**

   - Method: **POST**
   - URL: `{{base_url}}/api/items/bulk-upload`

3. **Set Headers**

   - `Authorization`: `Bearer {{token}}`
   - Do NOT set Content-Type (Postman will set it automatically for form-data)

4. **Set Body**

   - Select: **form-data**
   - Key: `file` (select "File" type)
   - Value: Click "Select Files" and choose your CSV file

5. **Send Request**
   - Click "Send"
   - Check the response for success/error details

### Example cURL Command

```bash
curl -X POST \
  http://localhost:5000/api/items/bulk-upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@items_upload_template.csv'
```

## Notes

- Maximum file size: 5MB
- Only CSV files are accepted
- The uploaded file is automatically deleted after processing
- Duplicate SKUs (within the CSV or existing in database) will be skipped with error messages
- Duplicate barcodes (within the CSV or existing in database) will be skipped with error messages
- Empty rows will be automatically skipped
- The API returns detailed error information for each failed row
- Subcategory lookup is cached to improve performance for large files

## Error Handling

Errors are reported per row, allowing you to:

- See exactly which rows failed
- Understand why each row failed
- Fix the CSV file and re-upload only the failed rows

## Performance

- Best for uploading up to 2000 items at once
- For larger files (like 1200 items), the system will handle it efficiently
- Processing time depends on CSV file size and number of records
- Subcategory lookups are cached to minimize database queries














