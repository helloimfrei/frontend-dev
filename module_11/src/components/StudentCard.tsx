import React from "react";
import { motion } from "framer-motion";
import type { Student } from "../App";

interface Props {
  student: Student;
  index?: number;
}

// Task 3: JSX function variable — derives pass/fail
const getPassStatus = (grade: number): "Passed" | "Failed" =>
  grade >= 75 ? "Passed" : "Failed";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// JSX object variable — maps a pass/fail key to its badge display config
const statusMeta: Record<"Passed" | "Failed", { label: string; className: string }> = {
  Passed: { label: "Passed", className: "badge pass" },
  Failed: { label: "Failed", className: "badge fail" },
};

// Task 8 / Pure component: React.memo prevents re-renders unless props change
const StudentCard: React.FC<Props> = React.memo(({ student, index = 0 }) => {
  const status = getPassStatus(student.grade);

  // Fan-in: alternate tilt direction based on index so cards flare out from center
  const tilt = (index % 2 === 0 ? -1 : 1) * (6 + (index % 3) * 2);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mx", `${x}%`);
    e.currentTarget.style.setProperty("--my", `${y}%`);
  };

  return (
    <motion.div
      className="card"
      layout
      style={{ transformOrigin: "50% 100%" }}
      variants={{
        hidden: {
          opacity: 0,
          y: 40,
          scale: 0.9,
          rotate: tilt,
        },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
          transition: {
            type: "spring",
            stiffness: 180,
            damping: 20,
            mass: 0.9,
          },
        },
      }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      onMouseMove={handleMouseMove}
    >
      <div className="card-id">#{String(student.id).padStart(3, "0")}</div>

      <div className="card-head">
        <div className="avatar">{initials(student.name)}</div>
        <div>
          <div className="name">{student.name}</div>
          <div className="major">
            {student.major} · Y{student.year}
          </div>
        </div>
      </div>

      <div className="meta-row">
        <span className="k">Grade</span>
        <span className="v">{student.grade}/100</span>
      </div>
      <div className="grade-bar" aria-hidden>
        <motion.div
          className="grade-fill"
          initial={{ width: 0 }}
          animate={{ width: `${student.grade}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="badges">
        {/* Task 3: pass/fail status — driven by the statusMeta JSX object variable */}
        <span className={statusMeta[status].className}>
          <span className="dot" />
          {statusMeta[status].label}
        </span>

        {/* Task 4: conditional rendering for active/inactive */}
        {student.isActive ? (
          <span className="badge active">
            <span className="dot" />
            Active
          </span>
        ) : (
          <span className="badge inactive">
            <span className="dot" />
            Inactive
          </span>
        )}
      </div>
    </motion.div>
  );
});

export default StudentCard;
