// Exception-Beispiel mit Fußball (Tore pro Spiel)
function pruefeToreException(tore) {
  if (tore < 0 || tore > 10) {
    throw new Error(
      "Ungültig: Die Anzahl der Tore muss zwischen 0 und 10 liegen.",
    );
  }
  return `Erfolg: ${tore} Tore wurden gespeichert.`;
}

console.log("--- Exception Stil ---");

try {
  const successMessage = pruefeToreException(11);
  console.log(successMessage);
} catch (error) {
  console.error("Fehler gefangen:", error.message);
}

// Result-Beispiel mit Fußball
function pruefeToreResult(tore) {
  if (tore < 0 || tore > 10) {
    return {
      ok: false,
      error: "Ungültig: Die Anzahl der Tore muss zwischen 0 und 10 liegen.",
    };
  }
  return { ok: true, value: `Erfolg: ${tore} Tore wurden gespeichert.` };
}

console.log("\n--- Result Stil ---");

const result = pruefeToreResult(11);
if (result.ok) {
  console.log(result.value);
} else {
  console.error("Fehler aufgetreten:", result.error);
}
