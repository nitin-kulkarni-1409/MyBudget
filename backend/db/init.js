const db = require("./database");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      amount REAL,
      description TEXT,
      expense_date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      amount REAL,
      income_date TEXT
    )
  `);
});
