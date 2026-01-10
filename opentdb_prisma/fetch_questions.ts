import { prisma } from "./db.ts";

type OTDBResponse = {
  response_code: number;
  results: Array<{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
};

function decodeHtml(s: string) {
  // einfache Ersetzungen für häufige Entities
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "é");
}

async function fetchAndStore(amount = 50) {
  const res = await fetch(`https://opentdb.com/api.php?amount=${amount}`);
  const data: OTDBResponse = await res.json();
  for (const r of data.results) {
    const q = decodeHtml(r.question);
    const correct = decodeHtml(r.correct_answer);
    const incorrect = r.incorrect_answers.map(decodeHtml);
    try {
      await prisma.question.upsert({
        where: { question: q },
        update: {
          category: r.category,
          type: r.type,
          difficulty: r.difficulty as any,
          correct_answer: correct,
          incorrect_answers: incorrect,
        },
        create: {
          category: r.category,
          type: r.type,
          difficulty: r.difficulty as any,
          question: q,
          correct_answer: correct,
          incorrect_answers: incorrect,
        },
      });
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    }
  }
  console.log("Fertig: importiert/aktualisiert", data.results.length, "Fragen");
}

if (import.meta.main) {
  const amountArg = Deno.args[0] ? Number(Deno.args[0]) : 50;
  await fetchAndStore(amountArg);
  await prisma.$disconnect();
}
