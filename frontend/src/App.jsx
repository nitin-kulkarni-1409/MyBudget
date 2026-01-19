import { useState } from "react";

function App() {
  const [amount, setAmount] = useState("");

  const saveExpense = async () => {
    await fetch("http://localhost:4000/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: 1,
        amount,
        description: "Test expense",
        expense_date: new Date().toISOString(),
      }),
    });
    alert("Expense saved");
  };

  return (
    <div>
      <h1>MyBudget</h1>
      <input
        placeholder="Amount"
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={saveExpense}>Add Expense</button>
    </div>
  );
}

export default App;
