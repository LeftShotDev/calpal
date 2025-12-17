#!/bin/bash
# Automated script to find all insights-related files
# T005: Find insights files

echo "=== Insights Feature Files ==="
echo ""

echo "## Insights Feature Module:"
find packages/features/insights -type f 2>/dev/null | head -20
echo "... (total: $(find packages/features/insights -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Insights tRPC Routers:"
find packages/trpc/server/routers/viewer/insights -type f 2>/dev/null
echo ""

echo "## Insights UI Pages:"
find apps/web/app -path "*/insights/*" -type f 2>/dev/null
find apps/web/modules/insights -type f 2>/dev/null
echo ""

echo "## Insights API Routes:"
find apps/web/pages/api/trpc/insights -type f 2>/dev/null
echo ""

echo "## Insights Prisma Schemas:"
find packages/prisma/zod/modelSchema -name "*BookingReport*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*BookingAudit*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*WatchlistEventAudit*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*FilterSegment*" -type f 2>/dev/null
echo ""

echo "## Analytics App Store Integrations:"
for app in ga4 gtm plausible posthog matomo umami fathom metapixel databuddy insights; do
  if [ -d "packages/app-store/$app" ]; then
    echo "packages/app-store/$app/ ($(find packages/app-store/$app -type f 2>/dev/null | wc -l) files)"
  fi
done
echo ""

echo "## Analytics Utilities:"
find packages/app-store/_utils -name "*analytics*" -o -name "*getAnalytics*" 2>/dev/null
echo ""

echo "## Data Table Feature (shared):"
find packages/features/data-table -type f 2>/dev/null | head -5
echo "... (total: $(find packages/features/data-table -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Insights Tests:"
find apps/web/playwright -name "*insights*" -type f 2>/dev/null
find apps/web/playwright/apps/analytics -type f 2>/dev/null
echo ""

echo "=== Total Insights Files: $(find . -path "*/insights/*" -o -name "*insights*" 2>/dev/null | grep -v node_modules | grep -v .next | wc -l) ==="
