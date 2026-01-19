import { useState } from "react";

function App() {
  const [amount, setAmount] = useState("");

  const saveExpense = async () => {
    await fetch("http://localhost:4000/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category_id: 1,
        amount: Number(amount),
        description: "Test expense",
        expense_date: new Date().toISOString()
      })
    });

    alert("Expense saved");
    setAmount("");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>MyBudget</h1>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={saveExpense} style={{ marginLeft: "10px" }}>
        Add Expense
      </button>
    </div>
  );
}

export default App;
