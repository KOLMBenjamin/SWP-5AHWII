import { PrismaClient } from "./prisma/client/client.ts";
import { categories } from "./seeddata.ts";

const prisma = new PrismaClient();

function decodeHtmlEntities(str: string) {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)));
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function requestToken() {
  const r = await fetch("https://opentdb.com/api_token.php?command=request");
  const j = await r.json();
  if (!j.token) throw new Error("Token request failed");
  return j.token as string;
}

async function fetchBatch(amount: number, categoryId: string, token: string) {
  const url =
    `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&token=${token}`;
  const r = await fetch(url);
  return r.json();
}

async function upsertMeta(categoryName: string, opentdbId: number) {
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: { opentdb_id: opentdbId },
    create: { name: categoryName, opentdb_id: opentdbId },
  });
  return category;
}

async function upsertDifficulty(level: string) {
  const d = await prisma.difficulty.upsert({
    where: { level },
    update: {},
    create: { level },
  });
  return d;
}

async function upsertType(typeName: string) {
  const t = await prisma.type.upsert({
    where: { type: typeName },
    update: {},
    create: { type: typeName },
  });
  return t;
}

async function importCategory(cat: { id: string; name: string }) {
  console.log(`\n==> Import Kategorie ${cat.name} (id=${cat.id})`);
  // Anzahl Fragen in Kategorie abfragen
  const countRes = await fetch(
    `https://opentdb.com/api_count.php?category=${cat.id}`,
  );
  const countJson = await countRes.json();
  const total = Number(
    countJson?.category_question_count?.total_question_count ?? 0,
  );
  if (!total) {
    console.log(`  Keine Fragen gefunden (${cat.name})`);
    return;
  }
  console.log(`  Gefundene Fragen (laut API): ${total}`);

  const token = await requestToken();
  console.log(`  Token erhalten`);

  const seen = new Set<string>(); // Verhindert doppelte Einträge basierend auf Text
  const categoryRecord = await upsertMeta(cat.name, Number(cat.id));

  let fetched = 0;
  const pageSize = 50;

  while (fetched < total) {
    const need = Math.min(pageSize, total - fetched);
    const batchJson = await fetchBatch(need, cat.id, token);

    // response_code: 0 success, 1 no results, 4 token empty (alle Fragen geliefert)
    const code = batchJson.response_code;
    if (code === 1) {
      console.log("  API: keine Results mehr");
      break;
    }
    if (code === 4) {
      console.log("  Token empty (alle eindeutigen Fragen geliefert)");
      break;
    }
    const results = batchJson.results || [];
    if (!results.length) break;

    for (const item of results) {
      const qText = decodeHtmlEntities(item.question || "");
      if (seen.has(qText)) continue;
      seen.add(qText);

      const diff = await upsertDifficulty(item.difficulty ?? "unknown");
      const typ = await upsertType(item.type ?? "multiple");

      // Antworten anlegen
      const correctText = decodeHtmlEntities(item.correct_answer || "");
      const incorrectsText = (item.incorrect_answers || []).map((s: string) =>
        decodeHtmlEntities(s)
      );

      const correct = await prisma.answer.create({
        data: { answer: correctText },
      });
      const incorrectCreated = [];
      for (const ia of incorrectsText) {
        const a = await prisma.answer.create({ data: { answer: ia } });
        incorrectCreated.push(a);
      }

      // Frage anlegen und Relationen verbinden
      await prisma.question.create({
        data: {
          question: qText,
          difficulty: { connect: { id: diff.id } },
          category: { connect: { id: categoryRecord.id } },
          type: { connect: { id: typ.id } },
          correct_answer: { connect: { id: correct.id } },
          incorrect_answers: {
            connect: incorrectCreated.map((x) => ({ id: x.id })),
          },
        },
      });
    }

    fetched = seen.size;
    console.log(`  Importiert: ${fetched}/${total}`);
    // kleine Pause, um API nicht zu überlasten
    await sleep(200);
  }

  console.log(
    `Fertig Kategorie ${cat.name}, insgesamt importiert: ${seen.size}`,
  );
}

async function main() {
  try {
    for (const c of categories) {
      await importCategory(c as any);
    }
    console.log("\nAlle Kategorien verarbeitet.");
  } catch (err) {
    console.error("Fehler beim Import:", err);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
