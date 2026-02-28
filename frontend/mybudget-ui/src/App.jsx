import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

const API_BASE = "http://localhost:4000";
const PAGE_SIZE = 10;
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea", "#0891b2"];

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1200px",
    margin: "auto",
    color: "#111827"
  },
  layout: {
    display: "flex",
    gap: "30px",
    alignItems: "flex-start"
  },
  left: {
    flex: 1,
    minWidth: "320px"
  },
  right: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "25px"
  },
  card: {
    background: "#f9fafb",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  row: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px"
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#ffffff"
  },
  th: {
    background: "#2563eb",
    color: "white",
    padding: "10px",
    textAlign: "left"
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #ddd",
    color: "#111827"
  },
  chartRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
  },
  tableMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    alignItems: "center"
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  smallButton: {
    padding: "6px 10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#111827",
    fontWeight: 600,
    minWidth: "56px"
  },
  muted: {
    color: "#64748b",
    fontSize: "14px"
  }
};

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

function isWithinRange(expenseDate, range) {
  if (!range) return true;
  const days = Number(range);
  if (!Number.isFinite(days) || days < 1) return true;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);

  const expense = new Date(expenseDate);
  return expense >= cutoff;
}

function formatMonthLabel(monthKey) {
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function App() {
  const [categories, setCategories] = useState([]);
  const [expensesPage, setExpensesPage] = useState({
    items: [],
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1
  });
  const [summary, setSummary] = useState({ categoryData: [], monthlyData: [] });

  const [selectedMonthRange, setSelectedMonthRange] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [tableLoading, setTableLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [form, setForm] = useState({
    category_id: "",
    description: "",
    amount: "",
    expense_date: ""
  });

  const categoryById = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Unable to fetch categories");
    const data = await res.json();
    setCategories(data);
  }, []);

  const fetchExpensesPage = useCallback(async () => {
    setTableLoading(true);
    try {
      const query = buildQuery({
        range: selectedMonthRange,
        sort: sortOption,
        page: currentPage,
        limit: PAGE_SIZE
      });
      const res = await fetch(`${API_BASE}/expenses?${query}`);
      if (!res.ok) throw new Error("Unable to fetch expenses");
      const data = await res.json();
      setExpensesPage(data);
    } finally {
      setTableLoading(false);
    }
  }, [selectedMonthRange, sortOption, currentPage]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const query = buildQuery({ range: selectedMonthRange });
      const res = await fetch(`${API_BASE}/expenses/summary?${query}`);
      if (!res.ok) throw new Error("Unable to fetch summary");
      const data = await res.json();
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMonthRange]);

  useEffect(() => {
    fetchCategories().catch((err) => {
      console.error(err);
    });
  }, [fetchCategories]);

  useEffect(() => {
    fetchExpensesPage().catch((err) => {
      console.error(err);
    });
  }, [fetchExpensesPage]);

  useEffect(() => {
    fetchSummary().catch((err) => {
      console.error(err);
    });
  }, [fetchSummary]);

  const tableRows = useMemo(() => {
    return expensesPage.items.map((expense) => {
      const amount = Number(expense.amount) || 0;
      return {
        ...expense,
        amount,
        categoryLabel:
          expense.category_name || categoryById[expense.category_id] || `Category ${expense.category_id}`
      };
    });
  }, [expensesPage.items, categoryById]);

  const chartCategoryData = useMemo(() => {
    return summary.categoryData.map((item) => ({
      ...item,
      value: Number(item.value) || 0,
      name: item.name || `Category ${item.category_id}`
    }));
  }, [summary.categoryData]);

  const chartMonthlyData = useMemo(() => {
    return summary.monthlyData.map((item) => ({
      month: formatMonthLabel(item.month),
      total: Number(item.total) || 0
    }));
  }, [summary.monthlyData]);

  const saveExpense = async () => {
    if (!form.category_id || !form.amount || !form.expense_date) {
      window.alert("Please fill Category, Amount, and Date.");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        category_id: Number(form.category_id),
        description: form.description,
        amount: Number(form.amount),
        expense_date: form.expense_date
      };

      const response = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Unable to save expense");
      }

      const created = await response.json();
      const createdExpense = {
        ...created,
        amount: Number(created.amount) || Number(payload.amount),
        category_name:
          created.category_name || categoryById[payload.category_id] || `Category ${payload.category_id}`
      };

      setForm({
        category_id: "",
        description: "",
        amount: "",
        expense_date: ""
      });

      const inCurrentRange = isWithinRange(createdExpense.expense_date, selectedMonthRange);
      const canOptimisticallyInsert = currentPage === 1 && sortOption === "date_desc" && inCurrentRange;

      if (inCurrentRange) {
        setExpensesPage((prev) => {
          const nextTotal = prev.total + 1;
          const nextTotalPages = Math.max(1, Math.ceil(nextTotal / prev.limit));

          if (!canOptimisticallyInsert) {
            return {
              ...prev,
              total: nextTotal,
              totalPages: nextTotalPages
            };
          }

          return {
            ...prev,
            items: [createdExpense, ...prev.items].slice(0, prev.limit),
            total: nextTotal,
            totalPages: nextTotalPages
          };
        });

        const monthKey = createdExpense.expense_date.slice(0, 7);
        const categoryName = createdExpense.category_name;

        setSummary((prev) => {
          const existingCategory = prev.categoryData.find(
            (item) => Number(item.category_id) === Number(createdExpense.category_id)
          );

          const updatedCategories = existingCategory
            ? prev.categoryData.map((item) =>
                Number(item.category_id) === Number(createdExpense.category_id)
                  ? { ...item, value: Number(item.value) + createdExpense.amount, name: categoryName }
                  : item
              )
            : [
                ...prev.categoryData,
                {
                  category_id: Number(createdExpense.category_id),
                  name: categoryName,
                  value: createdExpense.amount
                }
              ];

          const existingMonth = prev.monthlyData.find((item) => item.month === monthKey);
          const updatedMonths = existingMonth
            ? prev.monthlyData.map((item) =>
                item.month === monthKey
                  ? { ...item, total: Number(item.total) + createdExpense.amount }
                  : item
              )
            : [...prev.monthlyData, { month: monthKey, total: createdExpense.amount }].sort((a, b) =>
                a.month.localeCompare(b.month)
              );

          return {
            categoryData: updatedCategories,
            monthlyData: updatedMonths
          };
        });

        if (!canOptimisticallyInsert) {
          fetchExpensesPage().catch((err) => console.error(err));
        }
      }
    } catch (err) {
      console.error(err);
      window.alert("Failed to save expense.");
    } finally {
      setSaveLoading(false);
    }
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setCategorySaving(true);
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Unable to create category");
      }

      const created = await res.json();
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Failed to create category.");
    } finally {
      setCategorySaving(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const saveCategoryEdit = async () => {
    if (!editingCategoryId) return;
    const name = editingCategoryName.trim();
    if (!name) return;

    setCategorySaving(true);
    try {
      const res = await fetch(`${API_BASE}/categories/${editingCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Unable to update category");
      }

      const updated = await res.json();
      setCategories((prev) =>
        prev
          .map((category) =>
            category.id === editingCategoryId ? { ...category, name: updated.name } : category
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setSummary((prev) => ({
        ...prev,
        categoryData: prev.categoryData.map((item) =>
          Number(item.category_id) === Number(editingCategoryId)
            ? { ...item, name: updated.name }
            : item
        )
      }));

      cancelEditCategory();
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Failed to update category.");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    setCategorySaving(true);
    try {
      const res = await fetch(`${API_BASE}/categories/${category.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Unable to delete category");
      }

      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      if (Number(form.category_id) === Number(category.id)) {
        setForm((prev) => ({ ...prev, category_id: "" }));
      }
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Failed to delete category.");
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>MyBudget</h1>

      <div style={styles.layout}>
        <div style={styles.left}>
          <div style={styles.card}>
            <h2>Add Expense</h2>

            <div style={styles.row}>
              <select
                style={styles.input}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                style={styles.input}
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              />
            </div>

            <button style={styles.button} onClick={saveExpense} disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Add Expense"}
            </button>

            {categories.length === 0 && (
              <p style={styles.muted}>No expense categories found. Seeded defaults should appear after backend restart.</p>
            )}
          </div>

          <div style={{ ...styles.card, marginTop: "16px" }}>
            <h2>Manage Categories</h2>

            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                style={styles.smallButton}
                onClick={createCategory}
                disabled={categorySaving}
              >
                Add
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const isEditing = editingCategoryId === category.id;
                  return (
                    <tr key={category.id}>
                      <td style={styles.td}>
                        {isEditing ? (
                          <input
                            style={styles.input}
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                          />
                        ) : (
                          category.name
                        )}
                      </td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <>
                            <button
                              style={styles.smallButton}
                              onClick={saveCategoryEdit}
                              disabled={categorySaving}
                            >
                              Save
                            </button>{" "}
                            <button style={styles.smallButton} onClick={cancelEditCategory}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              style={styles.smallButton}
                              onClick={() => startEditCategory(category)}
                              disabled={categorySaving}
                            >
                              Edit
                            </button>{" "}
                            <button
                              style={styles.smallButton}
                              onClick={() => deleteCategory(category)}
                              disabled={categorySaving}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {categories.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={2}>
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p style={styles.muted}>
              Note: categories with existing expenses cannot be deleted.
            </p>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.row}>
            <select
              style={styles.input}
              value={selectedMonthRange}
              onChange={(e) => {
                setSelectedMonthRange(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last 1 Year</option>
            </select>

            <select
              style={styles.input}
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="date_desc">Date ↓ (Newest)</option>
              <option value="date_asc">Date ↑ (Oldest)</option>
              <option value="amount_desc">Amount ↓ (High)</option>
              <option value="amount_asc">Amount ↑ (Low)</option>
            </select>
          </div>

          <div style={styles.card}>
            <h2>Expenses</h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && !tableLoading && (
                  <tr>
                    <td style={styles.td} colSpan={4}>
                      No expenses found.
                    </td>
                  </tr>
                )}

                {tableRows.map((expense) => (
                  <tr key={expense.id}>
                    <td style={styles.td}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td style={styles.td}>{expense.categoryLabel}</td>
                    <td style={styles.td}>{expense.description || "-"}</td>
                    <td style={styles.td}>${expense.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.tableMeta}>
              <span style={styles.muted}>
                {tableLoading
                  ? "Loading..."
                  : `Showing page ${expensesPage.page} of ${expensesPage.totalPages} (${expensesPage.total} total)`}
              </span>

              <div style={styles.pagination}>
                <button
                  style={styles.smallButton}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || tableLoading}
                >
                  Prev
                </button>
                <button
                  style={styles.smallButton}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(expensesPage.totalPages || 1, p + 1)
                    )
                  }
                  disabled={currentPage >= expensesPage.totalPages || tableLoading}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2>Insights</h2>

            {summaryLoading ? (
              <p style={styles.muted}>Loading charts...</p>
            ) : (
              <div style={styles.chartRow}>
                <PieChart width={350} height={300}>
                  <Pie data={chartCategoryData} dataKey="value" nameKey="name" outerRadius={100}>
                    {chartCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>

                <BarChart width={450} height={300} data={chartMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#2563eb" />
                </BarChart>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
