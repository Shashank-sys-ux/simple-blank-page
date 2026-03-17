// localStorage database for CodeBuddy
const DB_KEY = 'codebuddy_v2';
let db = { participants: [] };

export function loadDB() {
  try {
    const d = localStorage.getItem(DB_KEY);
    if (d) db = JSON.parse(d);
  } catch (e) { /* ignore */ }
}

export function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) { /* ignore */ }
}

export function getDB() { return db; }

loadDB();
