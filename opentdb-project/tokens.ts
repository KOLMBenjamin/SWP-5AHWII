export type TokenRecord = { token: string; createdAt: string };

const TOKEN_FILE = "./tokens.json";

/**
 * Fordert einen neuen Token von OpenTDB an.
 */
export async function requestNewToken(): Promise<string> {
    const res = await fetch(
        "https://opentdb.com/api_token.php?command=request",
    );
    const j = await res.json();
    if (!j || j.response_code !== 0 || !j.token) {
        throw new Error("Token request failed");
    }
    const token: string = j.token;
    await saveToken({ token, createdAt: new Date().toISOString() });
    return token;
}

/**
 * Lädt gespeicherten Token aus tokens.json (falls vorhanden).
 */
export async function loadToken(): Promise<TokenRecord | null> {
    try {
        const raw = await Deno.readTextFile(TOKEN_FILE);
        return JSON.parse(raw) as TokenRecord;
    } catch {
        return null;
    }
}

/**
 * Speichert Token in tokens.json.
 */
export async function saveToken(rec: TokenRecord): Promise<void> {
    await Deno.writeTextFile(TOKEN_FILE, JSON.stringify(rec, null, 2));
}

/**
 * Liefert einen gültigen Token (aus Datei oder neu angefordert).
 * Simple Strategie: wenn kein Token vorhanden -> neu anfordern.
 * Du kannst hier erweitern (z.B. Reset wenn response_code === 4).
 */
export async function getToken(): Promise<string> {
    const existing = await loadToken();
    if (existing?.token) return existing.token;
    return await requestNewToken();
}
