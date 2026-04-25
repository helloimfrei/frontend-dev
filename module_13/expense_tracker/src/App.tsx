import { useCallback, useEffect, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { AnimatePresence, motion } from "framer-motion";
import { Line, Pie } from "react-chartjs-2";
import "./App.css";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const categories = ["Food", "Transport", "Shopping", "Bills", "Other"];
const chartColors = ["#fafafa", "#c7c7c7", "#929292", "#5f5f5f", "#2d2d2d"];

const cardVariants = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const listVariants = {
  visible: {
    transition: {
      staggerChildren: 0.045,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 18, transition: { duration: 0.18 } },
};

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
  const averageExpense = expenses.length ? totalExpenses / expenses.length : 0;
  const largestExpense = expenses.reduce(
    (largest, expense) => (expense.amount > largest.amount ? expense : largest),
    { amount: 0, title: "No expenses yet" } as Pick<Expense, "amount" | "title">,
  );
  const topCategory = Object.entries(
    expenses.reduce<Record<string, number>>((totals, expense) => {
      const key = expense.category || "Other";
      totals[key] = (totals[key] || 0) + expense.amount;
      return totals;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];
  const recentExpenses = expenses.slice(0, 4);
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
        borderColor: "#0b0b0b",
        hoverBorderColor: "#ffffff",
      },
    ],
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#d7d7d7",
          boxWidth: 12,
          padding: 18,
        },
      },
    },
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
        borderColor: "#fafafa",
        backgroundColor: "rgba(250, 250, 250, 0.08)",
        pointBackgroundColor: "#0b0b0b",
        pointBorderColor: "#fafafa",
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#d7d7d7",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9f9f9f" },
        grid: { color: "rgba(255, 255, 255, 0.06)" },
      },
      y: {
        ticks: { color: "#9f9f9f" },
        grid: { color: "rgba(255, 255, 255, 0.08)" },
      },
    },
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="appShell monochromeShell">
        <motion.section
          className="setupCard glassPanel"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <p className="eyebrow">Expense Tracker</p>
          <h1>Connect Supabase to start tracking expenses.</h1>
          <p>
            Create a <code>.env</code> file from <code>.env.example</code>, add your
            Supabase project URL and anon key, then restart <code>npm run dev</code>.
          </p>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="appShell monochromeShell">
      <motion.nav
        className="topBar"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="brandMark">ET</span>
        <span>Expense Terminal</span>
        <span className="syncBadge">{isLoading ? "Syncing" : "Live"}</span>
      </motion.nav>

      <section className="dashboardGrid">
        <motion.div
          className="heroPanel glassPanel"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.55 }}
        >
          <h1>Expense Tracker</h1>
          <div className="heroMetrics">
            <span>{expenses.length} records</span>
            <span>{topCategory ? `${topCategory[0]} leads` : "No category leader"}</span>
            <span>{formatCurrency(averageExpense)} average</span>
          </div>
        </motion.div>

        <motion.div
          className="totalCard glassPanel"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.55, delay: 0.08 }}
          whileHover={{ y: -6 }}
        >
          <span>Total Spend</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
          <small>Largest: {largestExpense.title} · {formatCurrency(largestExpense.amount)}</small>
        </motion.div>
      </section>

      <motion.section
        className="statsGrid"
        initial="hidden"
        animate="visible"
        variants={listVariants}
      >
        {[
          ["Records", expenses.length.toString()],
          ["Average", formatCurrency(averageExpense)],
          ["Top Category", topCategory?.[0] || "None"],
          ["Visible", filteredExpenses.length.toString()],
        ].map(([label, value]) => (
          <motion.div key={label} className="statCard glassPanel" variants={cardVariants}>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </motion.section>

      <section className="workspaceGrid">
        <motion.div
          className="panel glassPanel entryPanel"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">New Expense</p>
              <h2>Add a transaction</h2>
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
            <motion.button
              className="primaryButton"
              type="button"
              onClick={addExpense}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Add Expense
            </motion.button>
          </div>
        </motion.div>

        <motion.aside
          className="panel glassPanel activityPanel"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          <div className="sectionHeader compactHeader">
            <div>
              <p className="eyebrow">Pulse</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className="activityList">
            {recentExpenses.map((expense) => (
              <div className="activityItem" key={expense.id}>
                <span>{expense.title}</span>
                <strong>{formatCurrency(expense.amount)}</strong>
              </div>
            ))}
            {!recentExpenses.length && <p className="emptyState">No recent expenses.</p>}
          </div>
        </motion.aside>
      </section>

      <section className="chartsGrid">
        <motion.div
          className="panel glassPanel chartPanel"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={cardVariants}
        >
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">By Category</p>
              <h2>Spending breakdown</h2>
            </div>
          </div>
          {expenses.length ? (
            <Pie data={categoryChartData} options={pieChartOptions} />
          ) : (
            <p>No chart data yet.</p>
          )}
        </motion.div>

        <motion.div
          className="panel glassPanel chartPanel wideChart"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={cardVariants}
        >
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">By Month</p>
              <h2>Spending trend</h2>
            </div>
          </div>
          {expenses.length ? (
            <Line data={monthlyChartData} options={lineChartOptions} />
          ) : (
            <p>No chart data yet.</p>
          )}
        </motion.div>
      </section>

      <motion.section
        className="panel glassPanel"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={cardVariants}
      >
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
            <motion.tbody variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((expense) => (
                  <motion.tr
                    key={expense.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
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
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>

        {!filteredExpenses.length && !isLoading && (
          <p className="emptyState">No matching expenses yet.</p>
        )}
      </motion.section>
    </main>
  );
}

export default App;
