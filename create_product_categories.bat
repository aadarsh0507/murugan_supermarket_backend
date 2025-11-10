@echo off
REM Auto-generated script to create product categories for Windows
REM Update JWT_TOKEN below with your actual token from login

set JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTAxOTAyOTJhMjllYzM0ZTExMWUwMzMiLCJpYXQiOjE3NjIxNTQ2ODAsImV4cCI6MTc2Mjc1OTQ4MH0.1DbgL2GicXaJAaVMeygxSsBnFl2WWld2vvPUD13frwY

echo 🚀 Creating product categories...
echo.

echo Creating category: BABY_CARE
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"BABY_CARE\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: BAKERY
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"BAKERY\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: CONDIMENTS
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"CONDIMENTS\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: DAIRY
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"DAIRY\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: DATES
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"DATES\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: DHALL
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"DHALL\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: FLOUR
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"FLOUR\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: GENERAL
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"GENERAL\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: GHEE
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"GHEE\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: HAIR_CARE
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"HAIR_CARE\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: HOUSEHOLD
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"HOUSEHOLD\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: OILS
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"OILS\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: PERSONAL_CARE
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"PERSONAL_CARE\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: RICE
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"RICE\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: SEEDS
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"SEEDS\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: SNACKS
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"SNACKS\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: SPICES
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"SPICES\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: STATIONERY
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"STATIONERY\", \"level\": 2, \"isActive\": true}"

echo.
echo Creating category: SUGAR
curl -X POST http://localhost:5000/api/categories -H "Authorization: Bearer %JWT_TOKEN%" -H "Content-Type: application/json" -d "{\"name\": \"SUGAR\", \"level\": 2, \"isActive\": true}"

echo.
echo ✅ All categories created!

pause











