#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Script de prueba local para el follow-up endpoint
# Uso: bash test-follow-up.sh [dry_run] [campaign_id]
# ──────────────────────────────────────────────────────────────────────────────

ENDPOINT="https://ftyvtfnvechetczhcbfe.supabase.co/functions/v1/follow-up"
DRY_RUN="${1:-true}"     # default: dry_run=true (modo seguro)
CAMPAIGN_ID="${2:-}"

echo ""
echo "🔍 Probando follow-up endpoint..."
echo "   URL: $ENDPOINT"
echo "   Modo: $([ "$DRY_RUN" = "true" ] && echo "DRY RUN (sin envíos reales)" || echo "⚠️  PRODUCCIÓN (enviará mensajes)")"
[ -n "$CAMPAIGN_ID" ] && echo "   Campaña: $CAMPAIGN_ID"
echo ""

# Construir body
if [ -n "$CAMPAIGN_ID" ]; then
  BODY="{\"dry_run\":${DRY_RUN},\"campaign_id\":\"${CAMPAIGN_ID}\"}"
else
  BODY="{\"dry_run\":${DRY_RUN}}"
fi

RESPONSE=$(curl -s -w "\n%{http_code}" \
  --max-time 30 \
  -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$BODY")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY_RESPONSE=$(echo "$RESPONSE" | head -n -1)

echo "HTTP $HTTP_STATUS"
echo ""
echo "$BODY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BODY_RESPONSE"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  PROCESSED=$(echo "$BODY_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('processed',0))" 2>/dev/null || echo "?")
  echo "✅ $PROCESSED leads procesados"
else
  echo "❌ Error HTTP $HTTP_STATUS"
fi
