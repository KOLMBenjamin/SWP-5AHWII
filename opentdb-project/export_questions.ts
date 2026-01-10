import { PrismaClient } from "./prisma/client/client.ts";

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

async function main() {
    try {
        // Alle Fragen inkl. Relationen laden
        const questions = await prisma.question.findMany({
            include: {
                difficulty: true,
                category: true,
                type: true,
                correct_answer: true,
                incorrect_answers: true,
            },
        });

        const out = questions.map((q) => ({
            id: q.id,
            question: decodeHtmlEntities(q.question),
            category: q.category?.name ?? null,
            opentdb_category_id: q.category?.opentdb_id ?? null,
            difficulty: q.difficulty?.level ?? null,
            type: q.type?.type ?? null,
            correct_answer: decodeHtmlEntities(q.correct_answer?.answer ?? ""),
            incorrect_answers: (q.incorrect_answers || []).map((a) =>
                decodeHtmlEntities(a.answer)
            ),
        }));

        // In Datei schreiben
        const json = JSON.stringify(out, null, 2);
        await Deno.writeTextFile("./all_questions.json", json);

        // Kurz in Konsole ausgeben (erste 10)
        console.log(`Gesamtfragen: ${out.length}. Erste 10 Einträge:`);
        console.log(out.slice(0, 10));

        console.log("Alle Fragen wurden in all_questions.json geschrieben.");
    } catch (err) {
        console.error("Fehler beim Exportieren der Fragen:", err);
    } finally {
        await prisma.$disconnect();
    }
}

await main();
