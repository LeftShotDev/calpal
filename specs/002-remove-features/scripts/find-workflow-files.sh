#!/bin/bash
# Automated script to find all workflow-related files
# T004: Find workflow files

echo "=== Workflows Feature Files ==="
echo ""

echo "## Workflows Feature Module:"
find packages/features/ee/workflows -type f 2>/dev/null | head -20
echo "... (total: $(find packages/features/ee/workflows -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Workflows tRPC Routers:"
find packages/trpc/server/routers/viewer/workflows -type f 2>/dev/null
echo ""

echo "## Workflows UI Pages:"
find apps/web/app -path "*/workflows/*" -type f 2>/dev/null
echo ""

echo "## Workflows API Routes:"
find apps/web/app/api -path "*/workflows/*" -type f 2>/dev/null
find apps/web/pages/api/trpc/workflows -type f 2>/dev/null
echo ""

echo "## Workflows API V2 Module:"
find apps/api/v2/src/modules/workflows -type f 2>/dev/null | head -10
echo "... (total: $(find apps/api/v2/src/modules/workflows -type f 2>/dev/null | wc -l) files)"
echo ""

echo "## Workflows Email Templates:"
find packages/emails -name "*workflow*" -type f 2>/dev/null
echo ""

echo "## Workflows Prisma Schemas:"
find packages/prisma/zod/modelSchema -name "*Workflow*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*AIPhoneCall*" -type f 2>/dev/null
find packages/prisma/zod/modelSchema -name "*WebhookScheduledTriggers*" -type f 2>/dev/null
echo ""

echo "## Trigger.dev Integration:"
find packages/features -name "*trigger*" -type f 2>/dev/null | grep -v node_modules
find packages/lib -name "*trigger*" -type f 2>/dev/null | grep -v node_modules
echo ""

echo "## Tasker Integration:"
find packages/lib/tasker -type f 2>/dev/null
find packages/features/tasker -path "*/trigger*" -type f 2>/dev/null
echo ""

echo "## Workflows Tests:"
find apps/web/playwright -name "*workflow*" -type f 2>/dev/null
echo ""

echo "=== Total Workflow Files: $(find . -path "*/workflows/*" -o -name "*workflow*" -o -name "*Workflow*" -o -path "*/trigger*" 2>/dev/null | grep -v node_modules | grep -v .next | wc -l) ==="
