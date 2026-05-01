#!/bin/bash

echo "==============================="
echo "🔍 DIAGNÓSTICO DO MINDOS IA"
echo "==============================="

echo ""
echo "📁 Diretório atual:"
pwd

echo ""
echo "📦 Estrutura do projeto:"
ls -lah

echo ""
echo "📂 Apps disponíveis:"
ls apps 2>/dev/null

echo ""
echo "📂 API estrutura:"
ls apps/api 2>/dev/null

echo ""
echo "📂 Módulos backend:"
find apps/api/src/modules -maxdepth 1 -type d 2>/dev/null

echo ""
echo "📦 Dependências principais:"
grep -E '"(express|prisma|redis|aws|mercadopago)"' package.json 2>/dev/null

echo ""
echo "🐳 Containers rodando:"
docker ps

echo ""
echo "📊 Status containers:"
docker ps -a

echo ""
echo "📜 Logs API (últimas 20 linhas):"
docker logs operix-mind-api --tail=20 2>/dev/null

echo ""
echo "🌐 Teste API /health:"
curl -s http://localhost:3333/health || echo "❌ API não respondeu"

echo ""
echo "🧠 Teste rota IA:"
curl -s -X POST http://localhost:3333/ai/ask \
-H "Content-Type: application/json" \
-d '{"prompt":"teste"}' || echo "❌ IA não respondeu"

echo ""
echo "💰 Teste Mercado Pago:"
curl -s -X POST http://localhost:3333/payments/checkout \
-H "Content-Type: application/json" \
-d '{"plan":"pro"}' || echo "❌ Pagamento não respondeu"

echo ""
echo "🗄️ Teste banco (Postgres container):"
docker exec -it operix-mind-postgres pg_isready 2>/dev/null || echo "❌ Banco não respondeu"

echo ""
echo "🔐 Variáveis importantes:"
grep -E 'SECRET|JWT|AWS|MERCADO' .env 2>/dev/null

echo ""
echo "📦 Node version:"
node -v

echo ""
echo "📦 NPM version:"
npm -v

echo ""
echo "==============================="
echo "✅ DIAGNÓSTICO FINALIZADO"
echo "==============================="
