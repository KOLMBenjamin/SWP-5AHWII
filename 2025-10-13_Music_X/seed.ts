import { fakerDE_AT } from "@faker-js/faker";
import { PrismaClient } from "./prisma/client/client.ts";

const prisma = new PrismaClient();

async function main() {
    const artist = await prisma.artist.create({
        data: {
            name: fakerDE_AT.person.fullName(),
            sprache: fakerDE_AT.location.country(),
        },
    });
    console.log(`Artist: ${artist.name}`);

    const album = await prisma.album.create({
        data: {
            title: fakerDE_AT.music.album(),
            jahr: fakerDE_AT.number.int({ min: 1970, max: 2025 }),
            artistId: artist.id,
        },
    });
    console.log(`Album: ${album.title}`);

    const genre = await prisma.genre.create({
        data: {
            name: fakerDE_AT.music.genre(),
            erscheinungsjahr: fakerDE_AT.number.int({ min: 1950, max: 2025 }),
        },
    });
    console.log(`Genre: ${genre.name}`);

    for (let i = 0; i < 5; i++) {
        const song = await prisma.song.create({
            data: {
                name: fakerDE_AT.music.songName(),
                dauer: fakerDE_AT.number.int({ min: 120, max: 400 }),
                albumId: album.id,
                genreId: genre.id,
            },
        });
        console.log(` Song ${i + 1}: ${song.name}`);
    }

    console.log("\n Fake-Daten eingefügt");
}

try {
    await main();
    console.log("Daten erfolgreich eingefügt");
} catch (err) {
    console.error("Fehler beim Einfügen", err);
} finally {
    await prisma.$disconnect();
}
