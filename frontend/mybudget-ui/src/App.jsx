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
  Legend
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF"];

// Example categories — can fetch from DB later
const CATEGORY_LIST = [
  { id: 1, name: "Groceries" },
  { id: 2, name: "Bills" },
  { id: 3, name: "Food" },
  { id: 4, name: "Kids Tuition" },
  { id: 5, name: "Transport" }
];

function App() {
  const [category, setCategory] = useState(CATEGORY_LIST[0].id);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [tips, setTips] = useState([]);

  const fetchExpenses = async () => {
    const res = await fetch("http://localhost:4000/expenses");
    const data = await res.json();
    setExpenses(data);
    calculateTips(data);
  };

  const saveExpense = async () => {
    if (!amount || !description) {
      alert("Please fill in all fields");
      return;
    }

    await fetch("http://localhost:4000/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: Number(category),
        description,
        expense_date: date,
        amount: Number(amount)
      })
    });

    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategory(CATEGORY_LIST[0].id);

    fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Pie chart data
  const pieData = expenses.reduce((acc, curr) => {
    const catName = CATEGORY_LIST.find((c) => c.id === curr.category_id)?.name || `Category ${curr.category_id}`;
    const existing = acc.find((c) => c.name === catName);
    if (existing) existing.value += curr.amount;
    else acc.push({ name: catName, value: curr.amount });
    return acc;
  }, []);

  // Bar chart data (month-wise)
  const barData = expenses.reduce((acc, curr) => {
    const month = new Date(curr.expense_date).toLocaleString("default", { month: "short", year: "numeric" });
    const existing = acc.find((m) => m.month === month);
    if (existing) existing.amount += curr.amount;
    else acc.push({ month, amount: curr.amount });
    return acc;
  }, []);

  // Savings tips
  const calculateTips = (data) => {
    const total = data.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals = {};
    data.forEach((e) => {
      if (!categoryTotals[e.category_id]) categoryTotals[e.category_id] = 0;
      categoryTotals[e.category_id] += e.amount;
    });

    const newTips = [];

    for (let cat in categoryTotals) {
      const percent = (categoryTotals[cat] / total) * 100;
      if (percent > 30) {
        const name = CATEGORY_LIST.find((c) => c.id === Number(cat))?.name || `Category ${cat}`;
        newTips.push(`${name} is ${percent.toFixed(0)}% of your expenses. Consider reducing it.`);
      }
    }

    if (total < 0.2 * 1000) {
      newTips.push("Your savings are below 20% of your income. Try to save more.");
    }

    setTips(newTips);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>MyBudget</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>Category: </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_LIST.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label style={{ marginLeft: "10px" }}>Description: </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />

        <label style={{ marginLeft: "10px" }}>Date: </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label style={{ marginLeft: "10px" }}>Amount: </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button onClick={saveExpense} style={{ marginLeft: "10px" }}>
          Add Expense
        </button>
      </div>

      <h2>Expenses</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.expense_date).toLocaleDateString()}</td>
              <td>{CATEGORY_LIST.find((c) => c.id === e.category_id)?.name}</td>
              <td>${e.amount}</td>
              <td>{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "30px" }}>Expenses by Category</h2>
      <PieChart width={400} height={300}>
        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      <h2 style={{ marginTop: "30px" }}>Monthly Expenses</h2>
      <BarChart width={500} height={300} data={barData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#82ca9d" />
      </BarChart>

      <h2 style={{ marginTop: "30px" }}>Savings Suggestions</h2>
      {tips.length === 0 && <p>No suggestions at the moment. Good job!</p>}
      <ul>
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;