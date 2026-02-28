import { useEffect, useState } from "react";
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

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"];

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1200px",
    margin: "auto"
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
    borderCollapse: "collapse"
  },
  th: {
    background: "#2563eb",
    color: "white",
    padding: "10px",
    textAlign: "left"
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #ddd"
  },
  chartRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
  }
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedMonthRange, setSelectedMonthRange] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");

  const [form, setForm] = useState({
    category_id: "",
    description: "",
    amount: "",
    expense_date: ""
  });

  /* ---------------- Fetch Data ---------------- */

  const fetchExpenses = async () => {
    const res = await fetch("http://localhost:4000/expenses");
    const data = await res.json();
    setExpenses(data.reverse());
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  /* ---------------- Date Range (3 years) ---------------- */

  const now = new Date();
  const getCutoffDate = () => {
  const now = new Date();
  switch (selectedMonthRange) {
      case "30":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "60":
        return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      case "90":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "365":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };
  const maxMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const minDate = new Date(now.getFullYear() - 3, now.getMonth(), 1);

  const minMonth = `${minDate.getFullYear()}-${String(
    minDate.getMonth() + 1
  ).padStart(2, "0")}`;

  /* ---------------- Shared Filter ---------------- */

  const filteredExpenses = expenses.filter((e) => {
    if (!selectedMonthRange) return true;

    const cutoff = getCutoffDate();
    return new Date(e.expense_date) >= cutoff;
  });


  /* ---------------- Sorting (Table Only) ---------------- */

  const filteredAndSortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortOption) {
      case "date_asc":
        return new Date(a.expense_date) - new Date(b.expense_date);
      case "amount_desc":
        return b.amount - a.amount;
      case "amount_asc":
        return a.amount - b.amount;
      default:
        return new Date(b.expense_date) - new Date(a.expense_date);
    }
  });

  /* ---------------- Charts ---------------- */

  const categoryData = Object.values(
    filteredExpenses.reduce((acc, e) => {
      acc[e.category_id] = acc[e.category_id] || {
        name: `Category ${e.category_id}`,
        value: 0
      };
      acc[e.category_id].value += e.amount;
      return acc;
    }, {})
  );

  const monthlyData = Object.values(
    filteredExpenses.reduce((acc, e) => {
      const d = new Date(e.expense_date);
      const label = `${d.toLocaleString("default", {
        month: "short"
      })} ${d.getFullYear()}`;

      acc[label] = acc[label] || { month: label, total: 0 };
      acc[label].total += e.amount;
      return acc;
    }, {})
  );

  /* ---------------- Save Expense ---------------- */

  const saveExpense = async () => {
    await fetch("http://localhost:4000/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: Number(form.category_id),
        description: form.description,
        amount: Number(form.amount),
        expense_date: form.expense_date
      })
    });

    setForm({
      category_id: "",
      description: "",
      amount: "",
      expense_date: ""
    });

    fetchExpenses();
  };



  /* ---------------- UI ---------------- */

  return (
    <div style={styles.container}>
      <h1>💰 MyBudget</h1>

      <div style={styles.layout}>
        {/* LEFT */}
        <div style={styles.left}>
          <div style={styles.card}>
            <h2>Add Expense</h2>

            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Category ID"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />
            </div>

            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                style={styles.input}
                type="date"
                value={form.expense_date}
                onChange={(e) =>
                  setForm({ ...form, expense_date: e.target.value })
                }
              />
            </div>

            <button style={styles.button} onClick={saveExpense}>
              ➕ Add Expense
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          {/* FILTERS */}
          <div style={styles.row}>
            <select
              style={styles.input}
              value={selectedMonthRange}
              onChange={(e) => setSelectedMonthRange(e.target.value)}
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
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="date_desc">Date ↓ (Newest)</option>
              <option value="date_asc">Date ↑ (Oldest)</option>
              <option value="amount_desc">Amount ↓ (High)</option>
              <option value="amount_asc">Amount ↑ (Low)</option>
            </select>
          </div>

          {/* TABLE */}
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
                {filteredAndSortedExpenses.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>
                      {new Date(e.expense_date).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>{e.category_id}</td>
                    <td style={styles.td}>{e.description}</td>
                    <td style={styles.td}>${e.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CHARTS */}
          <div style={styles.card}>
            <h2>Insights</h2>

            <div style={styles.chartRow}>
              <PieChart width={350} height={300}>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>

              <BarChart width={450} height={300} data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" />
              </BarChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
