import { PrismaClient } from "./prisma/client/client.ts";

const prisma = new PrismaClient();

async function main() {
  await prisma.type.createMany({
    data: [
      { type: "True / False" },
      { type: "Multiple Choice" },
    ],
  });

  await prisma.difficulty.createMany({
    data: [
      { level: "Easy" },
      { level: "Medium" },
      { level: "Hard" },
    ],
  });

  await prisma.category.createMany({
    data: [
      { name: "General Knowledge", opentdb_id: 9 },
      { name: "Entertainment: Books", opentdb_id: 10 },
      { name: "Entertainment: Film", opentdb_id: 11 },
      { name: "Entertainment: Music", opentdb_id: 12 },
      { name: "Entertainment: Musicals & Theatres", opentdb_id: 13 },
      { name: "Entertainment: Television", opentdb_id: 14 },
      { name: "Entertainment: Video Games", opentdb_id: 15 },
      { name: "Entertainment: Board Games", opentdb_id: 16 },
      { name: "Science & Nature", opentdb_id: 17 },
      { name: "Science: Computers", opentdb_id: 18 },
      { name: "Science: Mathematics", opentdb_id: 19 },
      { name: "Mythology", opentdb_id: 20 },
      { name: "Sports", opentdb_id: 21 },
      { name: "Geography", opentdb_id: 22 },
      { name: "History", opentdb_id: 23 },
      { name: "Politics", opentdb_id: 24 },
      { name: "Art", opentdb_id: 25 },
      { name: "Celebrities", opentdb_id: 26 },
      { name: "Animals", opentdb_id: 27 },
      { name: "Vehicles", opentdb_id: 28 },
      { name: "Entertainment: Comics", opentdb_id: 29 },
      { name: "Science: Gadgets", opentdb_id: 30 },
      { name: "Entertainment: Japanese Anime & Manga", opentdb_id: 31 },
      { name: "Entertainment: Cartoon & Animations", opentdb_id: 32 },
    ],
  });

}
