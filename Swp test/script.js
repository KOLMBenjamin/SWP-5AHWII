const records = [];
const STORAGE_KEY = "records_data";

function showError(msg) {
  const e = document.getElementById("error");
  if (e) e.textContent = msg || "";
}

function validateInputs() {
  const stadion =
    (document.getElementById("stadion") || {}).value?.trim() || "";
  const alterStr = (document.getElementById("alter") || {}).value?.trim() || "";
  const match = (document.getElementById("match") || {}).value?.trim() || "";

  if (!stadion || !match) {
    showError("Bitte Stadion und Match ausfüllen!");
    return false;
  }

  if (!alterStr) {
    showError("Alter muss eine Zahl sein ");
    return false;
  }

  const age = Number(alterStr);
  if (
    Number.isNaN(age) ||
    !Number.isFinite(age) ||
    !Number.isInteger(age) ||
    age < 0
  ) {
    showError(" Alter muss eine ganze Zahl sein ");
    return false;
  }

  showError("");
  return { stadion, age, match };
}

function addData() {
  const valid = validateInputs();
  if (!valid) return;

  records.push(valid);
  saveToStorage();
  renderTable();

  document.getElementById("stadion").value = "";
  document.getElementById("alter").value = "";
  document.getElementById("match").value = "";
}

function renderTable() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.stadion)}</td>
      <td>${escapeHtml(String(r.age))}</td>
      <td>${escapeHtml(r.match)}</td>
      <td class="action-buttons">
        <button class="btn-delete" onclick="deleteRecord(${i})"> Löschen</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function deleteRecord(index) {
  if (confirm("Möchtest du diesen Datensatz löschen")) {
    records.splice(index, 1);
    saveToStorage();
    renderTable();
    showError("Datensatz gelöscht");
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    showError("Fehler beim Speichern" + e.message);
  }
}

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        records.length = 0;
        records.push(...parsed);
        renderTable();
        showError("Daten aus localStorage geladen");
      }
    } else {
      showError("Keine Daten  gefunden");
    }
  } catch (e) {
    showError("Fehler beim Laden" + e.message);
  }
}

function saveData() {
  try {
    const jsonString = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "records.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showError("Datei heruntergeladen!");
  } catch (e) {
    showError("Fehler beim Speichern: " + e.message);
  }
}

function bubbleSort(arr, comparator) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (comparator(arr[j], arr[j + 1]) > 0) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}

function sortData() {
  const sortField = document.getElementById("sortField").value;

  if (records.length === 0) {
    showError("Keine Datensätze zum Sortieren!");
    return;
  }

  if (sortField === "stadion") {
    bubbleSort(records, (a, b) => {
      const stadionA = (a.stadion || "").toLowerCase();
      const stadionB = (b.stadion || "").toLowerCase();
      return stadionA.localeCompare(stadionB);
    });
    showError("Nach Stadion sortiert!");
  } else if (sortField === "alter") {
    bubbleSort(records, (a, b) => a.age - b.age);
    showError("Nach Alter sortiert!");
  } else if (sortField === "match") {
    bubbleSort(records, (a, b) => {
      const matchA = (a.match || "").toLowerCase();
      const matchB = (b.match || "").toLowerCase();
      return matchA.localeCompare(matchB);
    });
    showError("Nach Match sortiert!");
  }

  saveToStorage();
  renderTable();
}

window.addEventListener("load", () => {
  loadFromStorage();
});
