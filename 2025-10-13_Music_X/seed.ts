// Importiert die deutsch-österreichische Konfiguration von faker
import { fakerDE_AT } from "@faker-js/faker";

// Importiert den generierten Prisma Client (den Pfad nutzt den im Projekt erzeugten Deno-Client)
import { PrismaClient } from "./prisma/client/client.ts";

// Erstelle eine Prisma-Client-Instanz, über die wir DB-Operationen ausführen
const prisma = new PrismaClient();

async function main() {
    // Erzeuge einen neuen Artist-Eintrag in der DB
    const artist = await prisma.artist.create({
        data: {
            // fakerDE_AT.person.fullName() generiert einen zufälligen Namen
            name: fakerDE_AT.person.fullName(),
            // sprache wird hier zufällig als ein Land ausgewählt (location.country())
            sprache: fakerDE_AT.location.country(),
        },
    });
    console.log(`Artist: ${artist.name}`);

    // Erzeuge ein Album, das dem oben erstellten Artist gehört
    const album = await prisma.album.create({
        data: {
            // Titel und Jahr mit Faker generiert
            title: fakerDE_AT.music.album(),
            jahr: fakerDE_AT.number.int({ min: 1970, max: 2025 }),
            // Verknüpfe das Album mit dem Artist per ID
            artistId: artist.id,
        },
    });
    console.log(`Album: ${album.title}`);

    // Erzeuge ein Genre (z. B. 'Pop', 'Rock')
    const genre = await prisma.genre.create({
        data: {
            name: fakerDE_AT.music.genre(),
            erscheinungsjahr: fakerDE_AT.number.int({ min: 1950, max: 2025 }),
        },
    });
    console.log(`Genre: ${genre.name}`);

    // Erzeuge 20 Songs (aktuell fest kodiert)
    for (let i = 0; i < 20; i++) {
        const song = await prisma.song.create({
            data: {
                // Zufälliger Songname und Dauer in Sekunden
                name: fakerDE_AT.music.songName(),
                dauer: fakerDE_AT.number.int({ min: 120, max: 400 }),
                // Verknüpfe Song mit Album und Genre
                albumId: album.id,
                genreId: genre.id,
            },
        });
        console.log(` Song ${i + 1}: ${song.name}`);
    }

    console.log("\n Fake-Daten eingefügt");
}

// Standard-Try/Catch/Finally für asynchrone Ausführung und sauberem Disconnect
try {
    await main();
    console.log("Daten erfolgreich eingefügt");
} catch (err) {
    console.error("Fehler beim Einfügen", err);
} finally {
    // immer den Prisma-Client trennen, damit der Prozess sauber endet
    await prisma.$disconnect();
}
