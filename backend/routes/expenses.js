const express = require("express");
const router = express.Router();
const db = require("../db/database");

const SORT_MAP = {
  date_desc: "e.expense_date DESC, e.id DESC",
  date_asc: "e.expense_date ASC, e.id ASC",
  amount_desc: "e.amount DESC, e.id DESC",
  amount_asc: "e.amount ASC, e.id ASC"
};

function toPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  if (max && parsed > max) return max;
  return parsed;
}

function buildRangeClause(range) {
  const days = Number.parseInt(range, 10);
  if (Number.isNaN(days) || days < 1) {
    return { clause: "", params: [] };
  }

  return {
    clause: " WHERE date(e.expense_date) >= date('now', ?)",
    params: [`-${days} days`]
  };
}

router.post("/", (req, res) => {
  const { category_id, amount, description, expense_date } = req.body;
  const numericCategoryId = Number(category_id);
  const numericAmount = Number(amount);

  if (!Number.isInteger(numericCategoryId) || numericCategoryId < 1) {
    return res.status(400).json({ error: "category_id must be a valid integer" });
  }

  if (!Number.isFinite(numericAmount)) {
    return res.status(400).json({ error: "amount must be a valid number" });
  }

  if (!expense_date) {
    return res.status(400).json({ error: "expense_date is required" });
  }

  db.run(
    `INSERT INTO expenses (category_id, amount, description, expense_date)
     VALUES (?, ?, ?, ?)`,
    [numericCategoryId, numericAmount, description || "", expense_date],
    function (err) {
      if (err) return res.status(500).json(err);

      db.get(
        `SELECT e.*, c.name AS category_name
         FROM expenses e
         LEFT JOIN categories c ON c.id = e.category_id
         WHERE e.id = ?`,
        [this.lastID],
        (rowErr, row) => {
          if (rowErr) return res.status(500).json(rowErr);
          res.status(201).json(row);
        }
      );
    }
  );
});

router.get("/", (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 10, 100);
  const sort = SORT_MAP[req.query.sort] ? req.query.sort : "date_desc";
  const offset = (page - 1) * limit;
  const { clause, params } = buildRangeClause(req.query.range);

  const countSql = `SELECT COUNT(*) AS total FROM expenses e${clause}`;
  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json(countErr);

    const total = countRow?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const dataSql = `
      SELECT e.*, c.name AS category_name
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      ${clause}
      ORDER BY ${SORT_MAP[sort]}
      LIMIT ? OFFSET ?
    `;

    db.all(dataSql, [...params, limit, offset], (rowsErr, rows) => {
      if (rowsErr) return res.status(500).json(rowsErr);

      res.json({
        items: rows,
        page,
        limit,
        total,
        totalPages
      });
    });
  });
});

router.get("/summary", (req, res) => {
  const { clause, params } = buildRangeClause(req.query.range);

  const categorySql = `
    SELECT
      e.category_id AS category_id,
      COALESCE(c.name, 'Category ' || e.category_id) AS category_name,
      ROUND(SUM(e.amount), 2) AS total
    FROM expenses e
    LEFT JOIN categories c ON c.id = e.category_id
    ${clause}
    GROUP BY e.category_id, c.name
    ORDER BY total DESC
  `;

  db.all(categorySql, params, (categoryErr, categoryRows) => {
    if (categoryErr) return res.status(500).json(categoryErr);

    const monthlySql = `
      SELECT
        strftime('%Y-%m', e.expense_date) AS month_key,
        ROUND(SUM(e.amount), 2) AS total
      FROM expenses e
      ${clause}
      GROUP BY month_key
      ORDER BY month_key ASC
    `;

    db.all(monthlySql, params, (monthErr, monthlyRows) => {
      if (monthErr) return res.status(500).json(monthErr);

      res.json({
        categoryData: categoryRows.map((row) => ({
          category_id: row.category_id,
          name: row.category_name,
          value: Number(row.total) || 0
        })),
        monthlyData: monthlyRows.map((row) => ({
          month: row.month_key,
          total: Number(row.total) || 0
        }))
      });
    });
  });
});

module.exports = router;
