const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.post("/", (req, res) => {
  const { category_id, amount, description, expense_date } = req.body;

  db.run(
    `INSERT INTO expenses (category_id, amount, description, expense_date)
     VALUES (?, ?, ?, ?)`,
    [category_id, amount, description, expense_date],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID });
    }
  );
});

router.get("/", (req, res) => {
  db.all(`SELECT * FROM expenses`, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
