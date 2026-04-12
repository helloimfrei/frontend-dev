import { motion } from "framer-motion";

const Header = () => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="header-left">
        <motion.div
          className="mark"
          whileHover={{ rotate: -6 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          SD
        </motion.div>
        <div>
          <div className="eyebrow">Module 11 / Cohort Overview</div>
          <h1>Student Dashboard</h1>
        </div>
      </div>

      <div className="meta">
        <span>
          <span className="live-dot" style={{ display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
          Live
        </span>
        <span>{today.toUpperCase()}</span>
      </div>
    </motion.header>
  );
};

export default Header;
