Kurz (Deno-fokussiert)

Voraussetzungen
- Node (nur einmal für Prisma-Client & Migration)
- Deno (für Laufzeit)

1) Einmalig (Node)
npm init -y
npm install -D prisma
npm install @prisma/client
npx prisma generate
npx prisma migrate dev --name init

2) Laufzeit (Deno)
deno task fetch        # importiert Fragen (erfordert --allow-net --allow-read --allow-write)
deno task serve        # startet API auf Port 8000 (erfordert --allow-net --allow-read --allow-env)

Beispiel-API:
GET http://localhost:8000/questions?limit=10

Hinweis:
- Wenn Node-Version Probleme macht: Node updaten oder Docker nutzen.
- Deno benötigt Berechtigungen: --allow-net, --allow-read, --allow-write, --allow-env.
