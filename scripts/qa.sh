#!/bin/bash

# QA Automation Script for 여시알바 (yeosijob.com)
# Usage: npm run qa

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEV_PORT=3001
DEV_SERVER_PID=""
DEV_SERVER_STARTED_BY_SCRIPT=false

# Function to print section header
print_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to print test result
print_result() {
  local status=$1
  local message=$2
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓ PASS${NC} $message"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗ FAIL${NC} $message"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠ WARN${NC} $message"
    WARNINGS=$((WARNINGS + 1))
  fi
}

# Cleanup function
cleanup() {
  if [ "$DEV_SERVER_STARTED_BY_SCRIPT" = true ] && [ -n "$DEV_SERVER_PID" ]; then
    echo -e "\n${YELLOW}Stopping dev server (PID: $DEV_SERVER_PID)...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
    wait $DEV_SERVER_PID 2>/dev/null || true
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Change to project directory
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           여시알바 (yeosijob.com) QA Suite              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. PRISMA MIGRATION STATUS CHECK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "1. Prisma Migration Status Check"

MIGRATION_OUTPUT=$(npx prisma migrate status 2>&1) || true
MIGRATION_EXIT_CODE=$?

echo "$MIGRATION_OUTPUT"

if echo "$MIGRATION_OUTPUT" | grep -q "following migrations have not yet been applied" || \
   echo "$MIGRATION_OUTPUT" | grep -q "drift"; then
  print_result "WARN" "Unapplied migrations or schema drift detected"
  echo -e "${YELLOW}  → Run 'npx prisma migrate dev' or 'npx prisma migrate deploy'${NC}"
elif echo "$MIGRATION_OUTPUT" | grep -q "Database schema is up to date"; then
  print_result "PASS" "All migrations applied"
else
  print_result "WARN" "Could not determine migration status"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. BUILD CHECK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "2. Build Check"

echo "Running: npm run build"
if npm run build > /tmp/qa-build.log 2>&1; then
  print_result "PASS" "Build succeeded"
else
  print_result "FAIL" "Build failed"
  echo -e "${RED}Build output:${NC}"
  tail -50 /tmp/qa-build.log
  echo -e "\n${RED}QA aborted due to build failure. Fix build errors first.${NC}"
  exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. TYPESCRIPT TYPE CHECK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "3. TypeScript Type Check"

echo "Running: npx tsc --noEmit"
if npx tsc --noEmit > /tmp/qa-tsc.log 2>&1; then
  print_result "PASS" "No type errors"
else
  TSC_ERRORS=$(grep -c "error TS" /tmp/qa-tsc.log 2>/dev/null || echo "0")
  print_result "FAIL" "TypeScript errors found ($TSC_ERRORS errors)"
  echo -e "${RED}Type errors:${NC}"
  grep "error TS" /tmp/qa-tsc.log | head -20
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. HTTP ACCESSIBILITY TEST (Local Dev Server)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "4. HTTP Accessibility Test (localhost:$DEV_PORT)"

# Check if dev server is already running
if lsof -i:$DEV_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${GREEN}Dev server already running on port $DEV_PORT${NC}"
else
  echo -e "${YELLOW}Starting dev server on port $DEV_PORT...${NC}"
  PORT=$DEV_PORT npm run dev > /tmp/qa-dev-server.log 2>&1 &
  DEV_SERVER_PID=$!
  DEV_SERVER_STARTED_BY_SCRIPT=true

  # Wait for server to be ready (max 30 seconds)
  echo -n "Waiting for server to start"
  for i in {1..30}; do
    if curl -s http://localhost:$DEV_PORT/ >/dev/null 2>&1; then
      echo -e " ${GREEN}✓${NC}"
      break
    fi
    echo -n "."
    sleep 1

    if [ $i -eq 30 ]; then
      echo -e " ${RED}✗${NC}"
      print_result "FAIL" "Dev server did not start within 30 seconds"
      echo -e "${RED}Server log:${NC}"
      tail -20 /tmp/qa-dev-server.log
      exit 1
    fi
  done
fi

# Public pages to test
PUBLIC_PAGES=(
  "/"
  "/jobs"
  "/community"
  "/resumes"
  "/pricing"
  "/notice"
  "/about"
  "/terms"
  "/privacy"
  "/login"
  "/register"
  "/register/business"
  "/register/jobseeker"
  "/forgot-password"
  "/reset-password"
  "/verify-email"
  "/notifications"
  "/messages"
  "/community/new"
)

echo -e "\nTesting ${#PUBLIC_PAGES[@]} public pages...\n"

FAILED_PAGES=()

for page in "${PUBLIC_PAGES[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$DEV_PORT$page 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    print_result "PASS" "$page → $HTTP_CODE"
  elif [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
    print_result "PASS" "$page → $HTTP_CODE (redirect)"
  else
    print_result "FAIL" "$page → $HTTP_CODE"
    FAILED_PAGES+=("$page ($HTTP_CODE)")
  fi
done

# Check dev server logs for runtime errors
if [ "$DEV_SERVER_STARTED_BY_SCRIPT" = true ]; then
  echo -e "\n${BLUE}Checking dev server logs for errors...${NC}"

  if grep -iE "(error|exception|prisma.*unknown field)" /tmp/qa-dev-server.log | grep -v "DeprecationWarning" | head -10; then
    print_result "WARN" "Runtime errors detected in dev server logs"
  else
    print_result "PASS" "No runtime errors in dev server logs"
  fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. INTERNAL LINK VALIDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "5. Internal Link Validation"

echo "Extracting internal links from source code..."

# Extract all href="/..." and Link href="/..." patterns
INTERNAL_LINKS=$(grep -roh 'href="\(/[^"]*\)"' src/ 2>/dev/null | \
  sed 's/href="//;s/"$//' | \
  grep -v '^http' | \
  grep -v '#' | \
  sort -u)

# Get all actual routes from page.tsx files
# Remove route groups like (public), (auth), (admin) etc.
ACTUAL_ROUTES=$(find src/app -name "page.tsx" -exec echo {} \; | \
  sed 's|src/app||;s|/page\.tsx||' | \
  sed -E 's|/\([^)]+\)||g' | \
  sed 's|/\[id\]|/*|g' | \
  sed -E 's|/\[[^]]+\]|/*|g' | \
  sed 's|^$|/|' | \
  sort -u)

echo -e "\nFound $(echo "$INTERNAL_LINKS" | wc -l | xargs) internal links in source code"
echo "Found $(echo "$ACTUAL_ROUTES" | wc -l | xargs) actual routes"

DEAD_LINKS=()

echo "$INTERNAL_LINKS" | while read -r link; do
  if [ -z "$link" ]; then
    continue
  fi

  # Skip dynamic routes in links (they're valid)
  if echo "$link" | grep -qE '\?|#'; then
    link=$(echo "$link" | cut -d'?' -f1 | cut -d'#' -f1)
  fi

  # Check if link matches any route (including dynamic routes)
  MATCHED=false

  # Direct match
  if echo "$ACTUAL_ROUTES" | grep -q "^${link}$"; then
    MATCHED=true
  fi

  # Dynamic route match (e.g., /jobs/123 matches /jobs/*)
  for route in $ACTUAL_ROUTES; do
    if [[ "$route" == *"*"* ]]; then
      route_pattern=$(echo "$route" | sed 's|\*|[^/]*|g')
      if echo "$link" | grep -qE "^${route_pattern}$"; then
        MATCHED=true
        break
      fi
    fi
  done

  if [ "$MATCHED" = false ]; then
    echo "$link"
  fi
done > /tmp/qa-dead-links.txt

if [ -s /tmp/qa-dead-links.txt ]; then
  print_result "WARN" "Potential dead links found:"
  while read -r dead_link; do
    echo -e "  ${YELLOW}→${NC} $dead_link"
  done < /tmp/qa-dead-links.txt
else
  print_result "PASS" "All internal links are valid"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. FINAL REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_section "6. QA Summary"

echo -e "Total Tests:    $TOTAL_TESTS"
echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}"
echo -e "${RED}Failed:         $FAILED_TESTS${NC}"
echo -e "${YELLOW}Warnings:       $WARNINGS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                  ✓ QA PASSED                            ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "\n${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                  ✗ QA FAILED                            ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"

  if [ ${#FAILED_PAGES[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed pages:${NC}"
    for failed_page in "${FAILED_PAGES[@]}"; do
      echo -e "  ${RED}→${NC} $failed_page"
    done
  fi

  exit 1
fi
