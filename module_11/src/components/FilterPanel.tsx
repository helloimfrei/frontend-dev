import { motion } from "framer-motion";
import type { StatusFilter } from "../App";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
}

const OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const FilterPanel = ({ query, onQueryChange, status, onStatusChange }: Props) => {
  return (
    <motion.div
      className="filter-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search students by name..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="pill-group">
        {OPTIONS.map((opt) => {
          const isActive = status === opt.key;
          return (
            <button
              key={opt.key}
              className={`pill ${isActive ? "active" : ""}`}
              onClick={() => onStatusChange(opt.key)}
            >
              {isActive && (
                <motion.span
                  layoutId="pill-indicator"
                  className="pill-indicator"
                  style={{ left: 0, right: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 2 }}>
                {isActive && "› "}{opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FilterPanel;
