# Bulk Upload Suppliers API

## Endpoint

**POST** `/api/suppliers/bulk-upload`

## Description

Upload multiple suppliers from a CSV file. This endpoint allows you to bulk import supplier data into the system.

## Authentication

Required: Yes (Admin or Manager role)

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Request

### Method

- **POST** - Upload CSV file with supplier data

### Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Body (Form Data)

- **file**: CSV file containing supplier data (required)

### CSV File Format

The CSV file must have the following columns (case-sensitive):

#### Required Fields

- `companyName` - Company name
- `email` - Email address (must be unique)
- `primaryPhone` - Primary phone number

#### Optional Fields

- `contactPerson` - Contact person full name (or use `firstName` and `lastName` separately)
- `firstName` - Contact person first name
- `lastName` - Contact person last name
- `secondaryPhone` - Secondary phone number
- `street` - Street address
- `city` - City
- `state` - State/Province
- `zipCode` - ZIP/Postal code
- `country` - Country (defaults to "India" if not provided)
- `designation` - Contact person designation/role
- `gstNumber` - GST number
- `panNumber` - PAN number
- `accountNumber` - Bank account number
- `bankName` - Bank name
- `branch` - Bank branch
- `ifscCode` - IFSC code
- `creditLimit` - Credit limit (numeric)
- `paymentTerms` - Payment terms
- `isActive` - Active status (true/false, defaults to true)
- `notes` - Additional notes

### Sample CSV

See `suppliers_upload_template.csv` for a complete example.

```
companyName,contactPerson,email,primaryPhone,secondaryPhone,street,city,state,zipCode,country,designation,gstNumber,panNumber,accountNumber,bankName,branch,ifscCode,creditLimit,paymentTerms,isActive,notes
Company A,John Doe,john@companya.com,1234567890,9876543210,123 Main St,New York,NY,10001,USA,Sales Manager,12ABCDE1234F1Z5,ABCDE1234F,123456789,ABC Bank,Main Branch,ABCD0123456,50000,Net 30,true,Regular supplier
```

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Bulk upload completed. 3 supplier(s) created successfully.",
  "data": {
    "totalRows": 3,
    "successCount": 3,
    "errorCount": 0,
    "suppliers": [
      {
        "_id": "...",
        "companyName": "Company A",
        "email": "john@companya.com",
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
  "message": "No valid suppliers found in CSV file",
  "errors": [
    {
      "row": 2,
      "error": "Missing required fields (companyName, email, primaryPhone)",
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

1. **Email Uniqueness**

   - Each email must be unique within the database
   - No duplicate emails allowed in the CSV file
   - Existing suppliers with the same email will be skipped

2. **Required Fields**

   - `companyName` - Cannot be empty
   - `email` - Must be a valid email format
   - `primaryPhone` - Must be numeric

3. **Contact Person**

   - If `contactPerson` is provided, it will be split into firstName and lastName
   - If not provided, `firstName` and `lastName` can be provided separately
   - If neither is provided, firstName will default to "Unknown"

4. **Default Values**
   - `country` - Defaults to "India" if not provided
   - `creditLimit` - Defaults to 0 if not provided
   - `isActive` - Defaults to true if not provided
   - `stores` - Defaults to empty array (can be added later)

## Testing with Postman

### Steps:

1. **Import Environment or Set Variables**

   - `base_url`: `http://localhost:5000` (or your server URL)
   - `token`: Your JWT authentication token

2. **Create a New Request**

   - Method: **POST**
   - URL: `{{base_url}}/api/suppliers/bulk-upload`

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
  http://localhost:5000/api/suppliers/bulk-upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@suppliers_upload_template.csv'
```

## Notes

- Maximum file size: 5MB
- Only CSV files are accepted
- The uploaded file is automatically deleted after processing
- Duplicate emails (within the CSV or existing in database) will be skipped with error messages
- Empty rows will be automatically skipped
- The API returns detailed error information for each failed row

## Error Handling

Errors are reported per row, allowing you to:

- See exactly which rows failed
- Understand why each row failed
- Fix the CSV file and re-upload only the failed rows

## Performance

- Best for uploading up to 1000 suppliers at once
- For larger files, consider splitting into smaller batches
- Processing time depends on CSV file size and number of records
