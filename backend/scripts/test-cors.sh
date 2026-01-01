#!/bin/bash

# CORS Testing Script
# Usage: ./scripts/test-cors.sh [API_URL] [ALLOWED_ORIGIN]
#        or from backend directory: ./scripts/test-cors.sh
#
# Note: Make sure CORS_ALLOWED_ORIGINS is configured in your .env file
# Example: CORS_ALLOWED_ORIGINS=https://mydomain.com,https://*example.netlify.app,http://localhost:5173

API_URL="${1:-http://localhost:8000}"
ALLOWED_ORIGIN="${2:-http://localhost:5173}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing CORS Configuration"
echo "API URL: $API_URL"
echo "Allowed Origin: $ALLOWED_ORIGIN"
echo ""
echo -e "${YELLOW}ℹ️  Note: Tests 4 and 5 will show warnings if $ALLOWED_ORIGIN is not in CORS_ALLOWED_ORIGINS${NC}"
echo ""

# Test 1: Health check (should work without origin)
echo "1️⃣  Testing /health (no origin required)..."
response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$status" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Status: $status"
else
  echo -e "${RED}❌ FAIL${NC} - Status: $status"
fi
echo "Response: $body"
echo ""

# Test 2: Missing origin
echo "2️⃣  Testing missing Origin header..."
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/clues/encrypt" \
  -H "Content-Type: application/json" \
  -d '{}')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$status" = "403" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Status: $status (correctly rejected)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 403, got $status"
fi
echo "Response: $body"
echo ""

# Test 3: Disallowed origin (should return 403 - explicitly blocked)
echo "3️⃣  Testing disallowed origin (https://evil.com)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/clues/encrypt" \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.com" \
  -d '{}')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$status" = "403" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Status: $status (correctly blocked)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 403, got $status"
fi
echo "Response: $body"
echo ""

# Test 4: Allowed origin (should return 200/500 with CORS headers, or 403 if not configured)
echo "4️⃣  Testing allowed origin ($ALLOWED_ORIGIN)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/clues/encrypt" \
  -H "Content-Type: application/json" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -d '{}')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
headers=$(curl -s -I -X POST "$API_URL/clues/encrypt" \
  -H "Content-Type: application/json" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -d '{}' | grep -i "access-control" || echo "  (no CORS headers)")
if [ "$status" = "403" ]; then
  echo -e "${YELLOW}⚠️  WARNING${NC} - Got 403. Is $ALLOWED_ORIGIN in CORS_ALLOWED_ORIGINS?"
  echo "Response: $body"
elif [ "$status" = "200" ] || [ "$status" = "500" ]; then
  if echo "$headers" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✅ PASS${NC} - Status: $status (with CORS headers)"
    echo "CORS Headers:"
    echo "$headers" | sed 's/^/   /'
  else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Status: $status but no CORS headers"
  fi
  echo "Response: $body"
else
  echo -e "${RED}❌ FAIL${NC} - Unexpected status: $status"
  echo "Response: $body"
fi
echo ""

# Test 5: Preflight request (OPTIONS) with allowed origin
echo "5️⃣  Testing preflight request (OPTIONS) with allowed origin..."
response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$API_URL/clues/encrypt" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
status=$(echo "$response" | tail -n1)
headers=$(curl -s -I -X OPTIONS "$API_URL/clues/encrypt" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control")
if [ "$status" = "403" ]; then
  echo -e "${YELLOW}⚠️  WARNING${NC} - Got 403. Is $ALLOWED_ORIGIN in CORS_ALLOWED_ORIGINS?"
elif [ "$status" = "200" ] || [ "$status" = "204" ]; then
  if echo "$headers" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✅ PASS${NC} - Status: $status (with CORS headers)"
    echo "CORS Headers:"
    echo "$headers" | sed 's/^/   /'
  else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Status: $status but no CORS headers"
  fi
else
  echo -e "${RED}❌ FAIL${NC} - Status: $status"
fi
echo ""

# Test 6: Preflight request (OPTIONS) with disallowed origin (should return 403)
echo "6️⃣  Testing preflight request (OPTIONS) with disallowed origin..."
response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$API_URL/clues/encrypt" \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$status" = "403" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Status: $status (correctly blocked)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 403, got $status"
fi
echo "Response: $body"
echo ""

echo "🏁 Testing complete!"

