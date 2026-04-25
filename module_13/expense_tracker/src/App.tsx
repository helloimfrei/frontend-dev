import { useCallback, useEffect, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import "./App.css";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

ChartJS.register(
  ArcElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const categories = ["Food", "Transport", "Shopping", "Bills", "Other"];
const chartColors = ["#16a34a", "#2563eb", "#f97316", "#9333ea", "#64748b"];

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

type ExpenseRow = Expense & {
  amount: number | string;
};

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function normalizeExpense(expense: ExpenseRow): Expense {
  return {
    ...expense,
    amount: Number(expense.amount),
  };
}

function monthKey(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchExpenses = useCallback(async () => {
    const client = supabase;
    if (!client) return;

    setIsLoading(true);
    const { data, error } = await client
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setExpenses(((data || []) as ExpenseRow[]).map(normalizeExpense));
      setErrorMessage("");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchExpenses();
    });

    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          fetchExpenses();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchExpenses]);

  const addExpense = async () => {
    if (!supabase || !title.trim() || !amount || Number(amount) <= 0) return;

    const { error } = await supabase.from("expenses").insert([
      {
        title: title.trim(),
        amount: Number(amount),
        category,
      },
    ]);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setTitle("");
    setAmount("");
    setCategory("Food");
    fetchExpenses();
  };

  const deleteExpense = async (id: number) => {
    if (!supabase) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    fetchExpenses();
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category || "Other");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
    setEditCategory("Food");
  };

  const saveExpense = async (id: number) => {
    if (!supabase || !editTitle.trim() || !editAmount || Number(editAmount) <= 0) return;

    const { error } = await supabase
      .from("expenses")
      .update({
        title: editTitle.trim(),
        amount: Number(editAmount),
        category: editCategory,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    cancelEdit();
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    const key = expense.category || "Other";
    totals[key] = (totals[key] || 0) + expense.amount;
    return totals;
  }, {});

  const categoryLabels = Object.keys(categoryTotals);
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryLabels.map((label) => categoryTotals[label]),
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const monthlyTotals = expenses
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce<Record<string, number>>((totals, expense) => {
      const key = monthKey(expense.created_at);
      totals[key] = (totals[key] || 0) + expense.amount;
      return totals;
    }, {});

  const monthlyLabels = Object.keys(monthlyTotals);
  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Monthly spending",
        data: monthlyLabels.map((label) => monthlyTotals[label]),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.15)",
        tension: 0.35,
        fill: false,
      },
    ],
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="appShell">
        <section className="setupCard">
          <p className="eyebrow">Expense Tracker</p>
          <h1>Connect Supabase to start tracking expenses.</h1>
          <p>
            Create a <code>.env</code> file from <code>.env.example</code>, add your
            Supabase project URL and anon key, then restart <code>npm run dev</code>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="heroPanel">
        <div>
          <p className="eyebrow">Supabase Expense Tracker</p>
          <h1>Track spending, spot patterns, and keep your budget honest.</h1>
          <p className="heroCopy">
            Add, edit, delete, filter, and visualize expenses with realtime database
            updates.
          </p>
        </div>
        <div className="totalCard">
          <span>Total Expenses</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
          <small>{expenses.length} records synced</small>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">New Expense</p>
            <h2>Add a purchase</h2>
          </div>
          {errorMessage && <p className="errorText">{errorMessage}</p>}
        </div>

        <div className="formGrid">
          <label>
            Title
            <input
              type="text"
              placeholder="Coffee, rent, groceries..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="25.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button className="primaryButton" type="button" onClick={addExpense}>
            Add Expense
          </button>
        </div>
      </section>

      <section className="chartsGrid">
        <div className="panel chartPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">By Category</p>
              <h2>Spending breakdown</h2>
            </div>
          </div>
          {expenses.length ? <Pie data={categoryChartData} /> : <p>No chart data yet.</p>}
        </div>

        <div className="panel chartPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">By Month</p>
              <h2>Spending trend</h2>
            </div>
          </div>
          {expenses.length ? <Line data={monthlyChartData} /> : <p>No chart data yet.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader expenseHeader">
          <div>
            <p className="eyebrow">Expense List</p>
            <h2>{isLoading ? "Loading expenses..." : `${filteredExpenses.length} shown`}</h2>
          </div>
          <label className="searchBox">
            Search by title
            <input
              type="search"
              placeholder="Filter expenses"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    {editingId === expense.id ? (
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                    ) : (
                      expense.title
                    )}
                  </td>
                  <td>
                    {editingId === expense.id ? (
                      <select
                        value={editCategory}
                        onChange={(event) => setEditCategory(event.target.value)}
                      >
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="categoryPill">{expense.category || "Other"}</span>
                    )}
                  </td>
                  <td>
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                      />
                    ) : (
                      formatCurrency(expense.amount)
                    )}
                  </td>
                  <td>{new Date(expense.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      {editingId === expense.id ? (
                        <>
                          <button type="button" onClick={() => saveExpense(expense.id)}>
                            Save
                          </button>
                          <button type="button" className="mutedButton" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(expense)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="dangerButton"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredExpenses.length && !isLoading && (
          <p className="emptyState">No matching expenses yet.</p>
        )}
      </section>
    </main>
  );
}

export default App;
