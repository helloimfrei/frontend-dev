import { motion } from "framer-motion";

interface Props {
  total: number;
  active: number;
  inactive: number;
}

const StatsBar = ({ total, active, inactive }: Props) => {
  const cards = [
    { label: "Enrolled", value: total, sub: "TOTAL_ROSTER" },
    { label: "Active", value: active, sub: `${Math.round((active / total) * 100)}% OF TOTAL` },
    { label: "Inactive", value: inactive, sub: `${Math.round((inactive / total) * 100)}% OF TOTAL` },
  ];

  return (
    <motion.div
      className="stats"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
      }}
    >
      {cards.map((c) => (
        <motion.div
          key={c.label}
          className="stat-card"
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          <div className="label">{c.label}</div>
          <motion.div
            className="value"
            key={c.value}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {String(c.value).padStart(2, "0")}
          </motion.div>
          <div className="delta">{c.sub}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsBar;
