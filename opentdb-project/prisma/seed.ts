import { PrismaClient } from "./prisma/client/client.ts";
import { categories, difficulties } from "./prisma/seeddata.ts";

const prisma = new PrismaClient();

interface OpenTDBQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

interface OpenTDBCategory {
  id: number;
  name: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&nbsp;/g, " ")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, "...");
}

async function ensureLookupTables() {
  console.log(" Ensuring lookup tables");

  const difficulties = ["easy", "medium", "hard"];
  for (const level of difficulties) {
    await prisma.difficulty.upsert({
      where: { level },
      update: {},
      create: { level },
    });
  }
  console.log("Difficulties created");

  const types = ["multiple", "boolean"];
  for (const type of types) {
    await prisma.type.upsert({
      where: { type },
      update: {},
      create: { type },
    });
  }
  console.log(" Types created");
}

async function importQuestions() {
  try {
    console.log(" Starting OpenTDB import...");

    await ensureLookupTables();

    console.log("Fetching categories from OpenTDB");
    const categoriesResponse = await fetch(
      "https://opentdb.com/api_category.php",
    );

    if (!categoriesResponse.ok) {
      throw new Error(
        `Failed to fetch categories: ${categoriesResponse.status}`,
      );
    }

    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.trivia_categories as OpenTDBCategory[];
    console.log(`Found ${categories.length} categories`);

    console.log("Saving categories to database");
    for (const category of categories) {
      await prisma.category.upsert({
        where: { opentdb_id: category.id },
        update: { name: decodeHtmlEntities(category.name) },
        create: {
          name: decodeHtmlEntities(category.name),
          opentdb_id: category.id,
        },
      });
    }
    console.log("Categories saved");

    let totalImported = 0;
    let totalSkipped = 0;

    console.log(
      `\n Importing questions for ${categoriesToImport.length} categories...`,
    );

    for (const category of categoriesToImport) {
      console.log(`\nProcessing: ${category.name} (ID: ${category.id})`);

      const difficulties = ["easy", "medium"]; // Nur easy & medium zum Testen
      const types = ["multiple"]; // Nur multiple choice zum Testen

      for (const difficulty of difficulties) {
        for (const type of types) {
          const apiUrl =
            `https://opentdb.com/api.php?amount=5&category=${category.id}&difficulty=${difficulty}&type=${type}`;

          try {
            console.log(`Fetching ${difficulty} ${type} questions`);
            const response = await fetch(apiUrl);

            if (!response.ok) {
              console.log(`    HTTP Error: ${response.status}`);
              continue;
            }

            const data: OpenTDBResponse = await response.json();

            if (data.response_code !== 0 || data.results.length === 0) {
              console.log(`    No ${difficulty} ${type} questions found`);
              continue;
            }

            console.log(`    Processing ${data.results.length} questions`);

            let categoryImported = 0;
            let categorySkipped = 0;

            for (const questionData of data.results) {
              try {
                const decodedQuestion = decodeHtmlEntities(
                  questionData.question,
                );

                const existingQuestion = await prisma.question.findFirst({
                  where: { question: decodedQuestion },
                });

                if (existingQuestion) {
                  categorySkipped++;
                  continue;
                }

                const incorrectAnswers = questionData.incorrect_answers.map(
                  (answer) => decodeHtmlEntities(answer),
                );
                const correctAnswer = decodeHtmlEntities(
                  questionData.correct_answer,
                );
                const allAnswers = [...incorrectAnswers, correctAnswer];

                const answerRecords = await Promise.all(
                  allAnswers.map(async (answerText) => {
                    return await prisma.answer.upsert({
                      where: { answer: answerText },
                      update: {},
                      create: { answer: answerText },
                    });
                  }),
                );

                const correctAnswerRecord = answerRecords.find(
                  (answer) => answer.answer === correctAnswer,
                );

                if (!correctAnswerRecord) {
                  console.log(`  Correct answer not found for question`);
                  categorySkipped++;
                  continue;
                }

                await prisma.question.create({
                  data: {
                    question: decodedQuestion,
                    difficulty: {
                      connect: { level: questionData.difficulty },
                    },
                    category: {
                      connect: { opentdb_id: category.id },
                    },
                    type: {
                      connect: { type: questionData.type },
                    },
                    incorrect_answers: {
                      connect: answerRecords
                        .filter((answer) =>
                          answer.id !== correctAnswerRecord.id
                        )
                        .map((answer) => ({ id: answer.id })),
                    },
                    correct_answer: {
                      connect: { id: correctAnswerRecord.id },
                    },
                  },
                });

                categoryImported++;
                totalImported++;
                console.log(
                  `    Added: ${decodedQuestion.substring(0, 50)}...`,
                );
              } catch (error) {
                console.error(`    Error importing question:`, error);
                categorySkipped++;
              }
            }

            console.log(
              `    📊 ${difficulty}/${type}: Imported: ${categoryImported}, Skipped: ${categorySkipped}`,
            );

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(
              `     Error fetching ${difficulty} ${type} questions:`,
              error,
            );
          }
        }
      }
    }

    console.log(`\n Import completed!`);
    console.log(`Total imported: ${totalImported}`);
    console.log(`Total skipped: ${totalSkipped}`);

    const questionCount = await prisma.question.count();
    const categoryCount = await prisma.category.count();
    const answerCount = await prisma.answer.count();

    console.log(`\n Database statistics:`);
    console.log(`   Questions: ${questionCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Answers: ${answerCount}`);
  } catch (error) {
    console.error(" Import failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  await importQuestions();
}
