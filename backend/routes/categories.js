const express = require("express");
const router = express.Router();
const db = require("../db/database");

function normalizeName(name) {
  return String(name || "").trim();
}

router.get("/", (req, res) => {
  db.all(
    `SELECT id, name, type
     FROM categories
     WHERE type = 'expense'
     ORDER BY name ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

router.post("/", (req, res) => {
  const name = normalizeName(req.body?.name);
  const type = "expense";

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  db.get(
    `SELECT id FROM categories WHERE type = ? AND lower(name) = lower(?)`,
    [type, name],
    (existsErr, existsRow) => {
      if (existsErr) return res.status(500).json(existsErr);
      if (existsRow) {
        return res.status(409).json({ error: "Category with this name already exists" });
      }

      db.run(
        `INSERT INTO categories (name, type) VALUES (?, ?)`,
        [name, type],
        function (insertErr) {
          if (insertErr) return res.status(500).json(insertErr);
          res.status(201).json({ id: this.lastID, name, type });
        }
      );
    }
  );
});

router.put("/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const name = normalizeName(req.body?.name);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid category id" });
  }

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  db.get(`SELECT id FROM categories WHERE id = ? AND type = 'expense'`, [id], (findErr, row) => {
    if (findErr) return res.status(500).json(findErr);
    if (!row) return res.status(404).json({ error: "Category not found" });

    db.get(
      `SELECT id FROM categories WHERE type = 'expense' AND lower(name) = lower(?) AND id != ?`,
      [name, id],
      (existsErr, existsRow) => {
        if (existsErr) return res.status(500).json(existsErr);
        if (existsRow) {
          return res.status(409).json({ error: "Category with this name already exists" });
        }

        db.run(
          `UPDATE categories SET name = ? WHERE id = ?`,
          [name, id],
          (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);
            res.json({ id, name, type: "expense" });
          }
        );
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid category id" });
  }

  db.get(`SELECT id FROM categories WHERE id = ? AND type = 'expense'`, [id], (findErr, row) => {
    if (findErr) return res.status(500).json(findErr);
    if (!row) return res.status(404).json({ error: "Category not found" });

    db.get(
      `SELECT COUNT(*) AS total FROM expenses WHERE category_id = ?`,
      [id],
      (countErr, countRow) => {
        if (countErr) return res.status(500).json(countErr);
        if ((countRow?.total || 0) > 0) {
          return res.status(409).json({
            error: "Cannot delete category that is used by existing expenses"
          });
        }

        db.run(`DELETE FROM categories WHERE id = ?`, [id], (deleteErr) => {
          if (deleteErr) return res.status(500).json(deleteErr);
          res.status(204).send();
        });
      }
    );
  });
});

module.exports = router;
