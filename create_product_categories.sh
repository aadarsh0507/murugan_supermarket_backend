#!/bin/bash

# Auto-generated script to create product categories
# Run this after you have logged in and have your JWT token

echo "🚀 Creating product categories..."

export JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

echo "Creating category: BABY_CARE"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "BABY_CARE", "level": 2, "isActive": true}'

echo "Creating category: BAKERY"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "BAKERY", "level": 2, "isActive": true}'

echo "Creating category: CONDIMENTS"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "CONDIMENTS", "level": 2, "isActive": true}'

echo "Creating category: DAIRY"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "DAIRY", "level": 2, "isActive": true}'

echo "Creating category: DATES"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "DATES", "level": 2, "isActive": true}'

echo "Creating category: DHALL"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "DHALL", "level": 2, "isActive": true}'

echo "Creating category: FLOUR"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "FLOUR", "level": 2, "isActive": true}'

echo "Creating category: GENERAL"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "GENERAL", "level": 2, "isActive": true}'

echo "Creating category: GHEE"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "GHEE", "level": 2, "isActive": true}'

echo "Creating category: HAIR_CARE"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "HAIR_CARE", "level": 2, "isActive": true}'

echo "Creating category: HOUSEHOLD"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "HOUSEHOLD", "level": 2, "isActive": true}'

echo "Creating category: OILS"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "OILS", "level": 2, "isActive": true}'

echo "Creating category: PERSONAL_CARE"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "PERSONAL_CARE", "level": 2, "isActive": true}'

echo "Creating category: RICE"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "RICE", "level": 2, "isActive": true}'

echo "Creating category: SEEDS"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "SEEDS", "level": 2, "isActive": true}'

echo "Creating category: SNACKS"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "SNACKS", "level": 2, "isActive": true}'

echo "Creating category: SPICES"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "SPICES", "level": 2, "isActive": true}'

echo "Creating category: STATIONERY"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "STATIONERY", "level": 2, "isActive": true}'

echo "Creating category: SUGAR"
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "SUGAR", "level": 2, "isActive": true}'

echo "✅ All categories created!"
