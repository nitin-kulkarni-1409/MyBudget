const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "mybudget.db"),
  (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite DB");
  }
);

module.exports = db;
