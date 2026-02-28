const db = require("./database");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      amount REAL,
      description TEXT,
      expense_date TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
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

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_expenses_expense_date
    ON expenses(expense_date)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_expenses_category_id
    ON expenses(category_id)
  `);

  const defaults = [
    "Food(CC)",
    "Rent(CC)",
    "Transport(CC)",
    "Utilities(CC)",
    "CreditCard-Payments",
    "Entertainment(CC)",
    "Shopping(CC)",
    "Education",
    "Insurance(CC)",
    "Miscellaneous"
  ];

  const seedStmt = db.prepare(`
    INSERT INTO categories (name, type)
    SELECT ?, 'expense'
    WHERE NOT EXISTS (
      SELECT 1
      FROM categories
      WHERE type = 'expense' AND lower(trim(name)) = lower(trim(?))
    )
  `);

  defaults.forEach((name) => {
    seedStmt.run([name, name], (err) => {
      if (err) {
        console.error(`Unable to seed category "${name}":`, err.message);
      }
    });
  });

  seedStmt.finalize();
});
