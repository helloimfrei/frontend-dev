import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define Issue type
type Issue = {
  id: number;
  status: string;
  owner: string;
  created: Date;
  effort: number;
  completionDate?: Date;
  title: string;
  priority: string;
};

// --------------------
// Helper Functions
// --------------------
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "open") return "badge badge-open";
  if (s === "assigned") return "badge badge-assigned";
  if (s === "new") return "badge badge-new";
  if (s === "closed") return "badge badge-closed";
  return "badge";
}

function priorityBadgeClass(priority: string): string {
  const p = priority.toLowerCase();
  if (p === "high") return "badge priority-high";
  if (p === "medium") return "badge priority-medium";
  if (p === "low") return "badge priority-low";
  return "badge";
}

// --------------------
// Animation Variants
// --------------------
const rowVariants = {
  initial: { opacity: 0, x: -30, scale: 0.97 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.3 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

// --------------------
// IssueRow
// --------------------
class IssueRow extends React.Component<{
  issue: Issue;
  deleteIssue: (id: number) => void;
}> {
  render() {
    const { issue } = this.props;

    return (
      <motion.tr
        layout
        variants={rowVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <td className="col-id">#{issue.id}</td>
        <td>
          <motion.span
            className={statusBadgeClass(issue.status)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.15 }}
          >
            {issue.status}
          </motion.span>
        </td>
        <td>{issue.owner}</td>
        <td className="col-date">{formatDate(issue.created)}</td>
        <td className="col-effort">{issue.effort}h</td>
        <td className="col-date">
          {issue.completionDate ? formatDate(issue.completionDate) : "\u2014"}
        </td>
        <td className="col-title">{issue.title}</td>
        <td>
          <motion.span
            className={priorityBadgeClass(issue.priority)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
          >
            {issue.priority}
          </motion.span>
        </td>

        {/* Actions Column */}
        <td>
          <motion.button
            className="btn btn-delete"
            onClick={() => this.props.deleteIssue(issue.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            Delete
          </motion.button>
        </td>
      </motion.tr>
    );
  }
}

// --------------------
// IssueTable
// --------------------
class IssueTable extends React.Component<{
  issues: Issue[];
  deleteIssue: (id: number) => void;
}> {
  render() {
    const issueRows = this.props.issues.map((issue) => (
      <IssueRow
        key={issue.id}
        issue={issue}
        deleteIssue={this.props.deleteIssue}
      />
    ));

    return (
      <motion.div
        className="table-wrapper"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <table className="issue-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Created</th>
              <th>Effort</th>
              <th>Completion Date</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
            <AnimatePresence mode="popLayout">
              {issueRows}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </motion.div>
    );
  }
}

// --------------------
// IssueFilter
// --------------------
class IssueFilter extends React.Component {
  render() {
    return <div></div>;
  }
}

// --------------------
// IssueAdd
// --------------------
type IssueAddProps = {
  addIssue: (issue: Issue) => void;
};

type IssueAddState = {
  owner: string;
  title: string;
  effort: string;
  completionDate: string;
  priority: string;
};

class IssueAdd extends React.Component<IssueAddProps, IssueAddState> {
  constructor(props: IssueAddProps) {
    super(props);
    this.state = {
      owner: "",
      title: "",
      effort: "",
      completionDate: "",
      priority: "Low",
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    this.setState({ [name]: value } as Pick<
      IssueAddState,
      keyof IssueAddState
    >);
  };

  handleSubmit = (e: React.FormEvent) => {
    // Task 3: Part 2 - Prevent default form submission
    e.preventDefault();

    // Task 6: Part 2 - Form validation
    if (!this.state.owner || this.state.owner.length < 3) {
      alert("Owner must be at least 3 characters.");
      return;
    }
    if (!this.state.title || this.state.title.length < 5) {
      alert("Title must be at least 5 characters.");
      return;
    }
    if (!this.state.effort || Number(this.state.effort) <= 0 || isNaN(Number(this.state.effort))) {
      alert("Effort must be a positive number.");
      return;
    }

    const newIssue: Issue = {
      id: 0,
      status: "Open",
      owner: this.state.owner,
      created: new Date(),
      effort: Number(this.state.effort),
      completionDate: this.state.completionDate
        ? new Date(this.state.completionDate)
        : undefined,
      title: this.state.title,
      priority: this.state.priority,
    };

    this.props.addIssue(newIssue);

    // Clear form after submission
    this.setState({
      owner: "",
      title: "",
      effort: "",
      completionDate: "",
      priority: "Low",
    });
  };

  render() {
    return (
      // Task 3: Part 3 - Add onSubmit handler to form
      <motion.form
        onSubmit={this.handleSubmit}
        className="form-card"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2>Add New Issue</h2>
        <div className="form-grid">
          {/* Task 3: Part 1 - Add onChange handlers to all inputs */}
          <motion.div
            className="form-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label>Owner</label>
            <input name="owner" placeholder="e.g. John" value={this.state.owner} onChange={this.handleChange} />
          </motion.div>
          <motion.div
            className="form-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56 }}
          >
            <label>Title</label>
            <input name="title" placeholder="Describe the issue" value={this.state.title} onChange={this.handleChange} />
          </motion.div>
          <motion.div
            className="form-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
          >
            <label>Effort (hrs)</label>
            <input name="effort" placeholder="0" value={this.state.effort} onChange={this.handleChange} />
          </motion.div>
          <motion.div
            className="form-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68 }}
          >
            <label>Completion Date</label>
            <input name="completionDate" type="date" value={this.state.completionDate} onChange={this.handleChange} />
          </motion.div>
          <motion.div
            className="form-field"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.74 }}
          >
            <label>Priority</label>
            <select name="priority" value={this.state.priority} onChange={this.handleChange}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </motion.div>
        </div>
        <div className="form-actions">
          <motion.button
            type="submit"
            className="btn btn-primary"
            whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(99, 102, 241, 0.35)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Add Issue
          </motion.button>
        </div>
      </motion.form>
    );
  }
}

// --------------------
// IssueList
// --------------------
type IssueListState = {
  issues: Issue[];
};

class IssueList extends React.Component<{}, IssueListState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      issues: [
        {
          id: 1,
          status: "Open",
          owner: "John",
          created: new Date("2016-08-15"),
          effort: 5,
          completionDate: undefined,
          title: "Error in console when clicking Add",
          priority: "High",
        },
        {
          id: 2,
          status: "Assigned",
          owner: "Emma",
          created: new Date("2016-08-16"),
          effort: 14,
          completionDate: new Date("2016-08-30"),
          title: "Missing bottom border on panel",
          priority: "Low",
        },
      ],
    };
  }

  // Task 1: Implement Add Issue (Immutable Array Update)
  addIssue = (issue: Issue) => {
    // Task 4: Console log to demonstrate async state updates
    console.log("Before setState (addIssue) - current issues:", this.state.issues.length);

    const newId = Math.max(...this.state.issues.map((i) => i.id)) + 1;
    const updatedIssue = { ...issue, id: newId };

    this.setState((prevState) => ({
      issues: [...prevState.issues, updatedIssue],
    }));

    // Task 4: This will show OLD state because setState is async
    console.log("After setState (addIssue) - issues still shows old count:", this.state.issues.length);
  };

  // Task 2: Implement Delete Issue (Immutable Filter)
  deleteIssue = (id: number) => {
    // Task 4: Console log to demonstrate async state updates
    console.log("Before setState (deleteIssue) - current issues:", this.state.issues.length);

    this.setState((prevState) => ({
      issues: prevState.issues.filter((issue) => issue.id !== id),
    }));

    // Task 4: This will show OLD state because setState is async
    console.log("After setState (deleteIssue) - issues still shows old count:", this.state.issues.length);
  };

  render() {
    return (
      <React.Fragment>
        <motion.div
          className="app-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <h1>Issue Tracker</h1>
          <p className="subtitle">Track, manage, and resolve project issues</p>
        </motion.div>
        <IssueFilter />

        <motion.div
          className="stats-bar"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div
            className="total"
            key={this.state.issues.length}
            initial={{ scale: 1.2, color: "#6366f1" }}
            animate={{ scale: 1, color: "inherit" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Total Issues: <span>{this.state.issues.length}</span>
          </motion.div>
        </motion.div>

        <IssueTable
          issues={this.state.issues}
          deleteIssue={this.deleteIssue}
        />

        <hr className="divider" />

        <IssueAdd addIssue={this.addIssue} />
      </React.Fragment>
    );
  }
}

export default IssueList;
