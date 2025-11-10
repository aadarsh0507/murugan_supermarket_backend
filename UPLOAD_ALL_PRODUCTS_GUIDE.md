# Complete Guide to Upload Your 5512 Products

## 📊 Summary

Your product file `Products 28.10.csv` has been processed successfully!

### Generated Files:

- ✅ `products_upload_ready.csv` - All 5512 products ready to upload
- ✅ `create_product_categories.bat` - Script to create 19 categories
- ✅ `scripts/processProductsCSV.js` - Processing script

### Products Processed:

- **Total Products**: 5,512
- **Categories**: 19
- **All SKUs Generated**: Automatically created unique SKUs for each product

## 🚀 Step-by-Step Upload Process

### Step 1: Login and Get JWT Token

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"abc@gamil.com\", \"password\": \"YOUR_PASSWORD\"}"
```

**Copy the `token` from the response!**

### Step 2: Create Categories (19 categories)

**Option A: Use the Batch Script (Windows)**

1. Open `create_product_categories.bat` in notepad
2. Replace `YOUR_JWT_TOKEN_HERE` with your actual token
3. Save and double-click to run

**Option B: Manual Creation**

Run each command below (replace `YOUR_JWT_TOKEN`):

```bash
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"BABY_CARE\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"BAKERY\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"CONDIMENTS\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"DAIRY\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"DATES\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"DHALL\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"FLOUR\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"GENERAL\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"GHEE\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"HAIR_CARE\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"HOUSEHOLD\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"OILS\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"PERSONAL_CARE\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"RICE\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"SEEDS\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"SNACKS\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"SPICES\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"STATIONERY\", \"level\": 2, \"isActive\": true}"

curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"SUGAR\", \"level\": 2, \"isActive\": true}"
```

### Step 3: Verify Categories Created

```bash
curl -X GET http://localhost:5000/api/categories -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should see 19 categories with `level: 2`.

### Step 4: Upload Products

**Using cURL:**

```bash
curl -X POST http://localhost:5000/api/items/bulk-upload ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  -F "file=@products_upload_ready.csv"
```

**Using Postman:**

1. Method: `POST`
2. URL: `http://localhost:5000/api/items/bulk-upload`
3. Authorization: Type: `Bearer Token`, Token: your JWT
4. Body → form-data
   - Key: `file` (type: File)
   - Value: Select `products_upload_ready.csv`

**Expected Response:**

```json
{
  "success": true,
  "message": "Bulk upload completed. 5512 item(s) created successfully.",
  "data": {
    "totalRows": 5512,
    "successCount": 5512,
    "errorCount": 0,
    "items": [...],
    "errors": []
  }
}
```

**NOTE**: This is a large file (5512 products). The upload may take several minutes. Be patient!

## 📋 CSV Format

Your processed CSV has these columns:

| Column      | Description                 | Example                |
| ----------- | --------------------------- | ---------------------- |
| ProductName | Product name                | TURMERIC POWDER 500GM  |
| MRP         | Maximum Retail Price        | 125                    |
| SKU         | Unique SKU (auto-generated) | TURPOW500-0001         |
| Subcategory | Category level 2            | SPICES                 |
| Unit        | Unit of measurement         | packet, bag, liter, ml |
| Stock       | Initial stock               | 100                    |
| MinStock    | Minimum stock               | 10                     |
| Description | Product description         | TURMERIC POWDER 500GM  |

## 🔍 Product Categories

Your products are organized into **19 categories**:

1. **BABY_CARE** - Baby products, wipes, baby food
2. **BAKERY** - Cakes, rusks, cup cakes, brownies
3. **CONDIMENTS** - Sauces, peanut butter, idly powder
4. **DAIRY** - Milk and dairy products
5. **DATES** - Dry dates and fruits
6. **DHALL** - Dhall, pulses, gram, chick peas
7. **FLOUR** - Flour, atta, rava, sooji
8. **GENERAL** - Items that don't fit other categories
9. **GHEE** - Ghee and clarified butter
10. **HAIR_CARE** - Hair oil and hair care products
11. **HOUSEHOLD** - Household cleaning items
12. **OILS** - Cooking oils (gingelly, mustard, etc.)
13. **PERSONAL_CARE** - Soaps, bath products
14. **RICE** - Rice and rice products
15. **SEEDS** - Seeds like kasakasa, methi
16. **SNACKS** - Biscuits, cookies, chips
17. **SPICES** - Turmeric, chilli, masala powders
18. **STATIONERY** - Pens, erasers, sharpeners
19. **SUGAR** - Sugar products

## ⚠️ Important Notes

1. **File Size**: Your CSV is large (~5512 products). Upload may take 5-15 minutes.
2. **Token Expiry**: JWT tokens expire. If upload fails, get a new token.
3. **Server Memory**: Make sure your server has enough memory to process the file.
4. **Backup**: Backup your database before bulk upload.
5. **Error Handling**: The API processes all rows and reports both successes and errors.

## 🐛 Troubleshooting

### Issue: "No valid items found"

- ✅ Make sure categories were created with level=2
- ✅ Check that your JWT token is valid

### Issue: "Subcategory not found"

- ✅ Run all 19 category creation commands
- ✅ Verify categories exist using GET /api/categories

### Issue: Upload timeout

- ✅ Split the CSV into smaller chunks
- ✅ Upload in batches of 500-1000 products

### Issue: "Duplicate SKU"

- ✅ This shouldn't happen as SKUs are auto-generated
- ✅ If it occurs, there might be duplicate products in your original CSV

## 📝 Next Steps After Upload

1. **Verify Products**: Check a few products in your system
2. **Check Stock Levels**: Update stock levels if needed
3. **Review Categories**: Ensure products are in correct categories
4. **Update Prices**: Adjust MRP if needed
5. **Add Images**: Upload product images if available

## 🎉 Success!

Once uploaded successfully, you'll have all 5512 products in your system, ready to use!










