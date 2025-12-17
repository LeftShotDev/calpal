#!/bin/bash
# Automated script to find all routing-related files
# T003: Find routing files

echo "=== Routing Feature Files ==="
echo ""

echo "## Routing Forms Packages:"
find packages/app-store/routing-forms -type f 2>/dev/null | head -20
echo "... (total: $(find packages/app-store/routing-forms -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Routing Forms Features:"
find packages/features/routing-forms -type f 2>/dev/null | head -10
echo "... (total: $(find packages/features/routing-forms -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Routing Forms UI:"
find apps/web -path "*/routing-forms/*" -type f 2>/dev/null | head -10
echo "... (total: $(find apps/web -path "*/routing-forms/*" -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Routing tRPC Routers:"
find packages/trpc/server/routers -path "*/routing-forms/*" -type f 2>/dev/null
echo ""

echo "## Routing Prisma Schemas:"
find packages/prisma/zod/modelSchema -name "*RoutingForm*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*Attribute*" -type f 2>/dev/null
echo ""

echo "## Routing Tests:"
find apps/web/playwright -name "*routing*" -type f 2>/dev/null
echo ""

echo "## RAQB Libraries:"
find packages/lib/raqb -type f 2>/dev/null
find packages/app-store/_utils/raqb -type f 2>/dev/null
echo ""

echo "## Insights Routing Components:"
find packages/features/insights/components/routing -type f 2>/dev/null
echo ""

echo "=== Total Routing Files: $(find . -path "*/routing-forms/*" -o -path "*/raqb/*" -o -name "*RoutingForm*" 2>/dev/null | grep -v node_modules | grep -v .next | wc -l) ==="
