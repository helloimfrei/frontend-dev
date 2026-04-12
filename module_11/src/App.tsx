import { useMemo, useState } from "react";
import Header from "./components/Header";
import FilterPanel from "./components/FilterPanel";
import StudentList from "./components/StudentList";
import StatsBar from "./components/StatsBar";

export interface Student {
  id: number;
  name: string;
  grade: number;
  isActive: boolean;
  major: string;
  year: number;
}

export type StatusFilter = "all" | "active" | "inactive";

const studentsData: Student[] = [
  { id: 1, name: "Anna Bennett", grade: 92, isActive: true, major: "Computer Science", year: 3 },
  { id: 2, name: "John Carter", grade: 68, isActive: false, major: "Mechanical Eng.", year: 2 },
  { id: 3, name: "Maria Lopez", grade: 88, isActive: true, major: "Mathematics", year: 4 },
  { id: 4, name: "Sam Patel", grade: 74, isActive: true, major: "Physics", year: 1 },
  { id: 5, name: "Olivia Chen", grade: 95, isActive: true, major: "Data Science", year: 3 },
  { id: 6, name: "Marcus Wright", grade: 61, isActive: false, major: "History", year: 2 },
  { id: 7, name: "Layla Hassan", grade: 81, isActive: true, major: "Biology", year: 4 },
  { id: 8, name: "Diego Ramirez", grade: 77, isActive: true, major: "Economics", year: 2 },
  { id: 9, name: "Priya Shah", grade: 89, isActive: false, major: "Design", year: 3 },
  { id: 10, name: "Ethan Brooks", grade: 55, isActive: false, major: "English Lit.", year: 1 },
  { id: 11, name: "Zara Ibrahim", grade: 84, isActive: true, major: "Chemistry", year: 4 },
  { id: 12, name: "Noah Fischer", grade: 72, isActive: true, major: "Philosophy", year: 2 },
];

function App() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // Task 5 & 6: filter by status and by search query
  const visibleStudents = useMemo(() => {
    return studentsData
      .filter((s) =>
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? s.isActive
          : !s.isActive
      )
      .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [statusFilter, query]);

  // Task 7: counts
  const totalCount = studentsData.length;
  const activeCount = studentsData.filter((s) => s.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="app">
      <Header />
      <StatsBar total={totalCount} active={activeCount} inactive={inactiveCount} />
      <FilterPanel
        query={query}
        onQueryChange={setQuery}
        status={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <StudentList students={visibleStudents} />
    </div>
  );
}

export default App;
