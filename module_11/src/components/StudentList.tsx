import { AnimatePresence, motion } from "framer-motion";
import type { Student } from "../App";
import StudentCard from "./StudentCard";

interface Props {
  students: Student[];
}

const StudentList = ({ students }: Props) => {
  return (
    <section className="student-list">
      <div className="list-head">
        <h2>Roster</h2>
        <span className="count">
          {String(students.length).padStart(2, "0")} RECORDS
        </span>
      </div>

      {students.length === 0 ? (
        <motion.div
          className="empty"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          No records match current filters
        </motion.div>
      ) : (
        <motion.div
          className="grid"
          layout
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.07,
                delayChildren: 0.25,
              },
            },
          }}
        >
          <AnimatePresence mode="popLayout">
            {students.map((student, index) => (
              <StudentCard key={student.id} student={student} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};

export default StudentList;
