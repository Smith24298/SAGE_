import { Card } from "../components/ui/card";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { motion } from "motion/react";

const employees = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Senior Software Engineer",
    department: "Engineering",
    sentiment: 70,
    risk: "Medium",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Engineering Manager",
    department: "Engineering",
    sentiment: 85,
    risk: "Low",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Product Designer",
    department: "Design",
    sentiment: 92,
    risk: "Low",
  },
  {
    id: 4,
    name: "David Kim",
    role: "Sales Director",
    department: "Sales",
    sentiment: 78,
    risk: "Low",
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Marketing Manager",
    department: "Marketing",
    sentiment: 88,
    risk: "Low",
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Software Engineer",
    department: "Engineering",
    sentiment: 65,
    risk: "High",
  },
  {
    id: 7,
    name: "Maria Garcia",
    role: "HR Business Partner",
    department: "HR",
    sentiment: 90,
    risk: "Low",
  },
  {
    id: 8,
    name: "Robert Taylor",
    role: "Finance Analyst",
    department: "Finance",
    sentiment: 72,
    risk: "Medium",
  },
];

export function Employees() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          Employees
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage employee profiles
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-input-background rounded-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/employee/${employee.id}`} className="block">
              <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-sm mb-1" style={{ fontWeight: 600 }}>
                    {employee.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {employee.role}
                  </p>
                  <div className="w-full pt-3 border-t border-border mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Sentiment</span>
                      <span style={{ fontWeight: 600 }}>
                        {employee.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-muted-foreground">Risk Level</span>
                      <span
                        className={`${
                          employee.risk === "Low"
                            ? "text-green-600"
                            : employee.risk === "Medium"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {employee.risk}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
