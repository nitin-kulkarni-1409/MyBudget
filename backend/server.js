const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const expenseRoutes = require("./routes/expenses");
app.use("/expenses", expenseRoutes);

app.get("/", (req, res) => {
  res.send("MyBudget Backend Running");
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
