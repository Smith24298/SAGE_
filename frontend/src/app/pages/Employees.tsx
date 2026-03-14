import { Card } from "../components/ui/card";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { EmployeeAvatar } from "../components/EmployeeAvatar";
import { useEmployeesList } from "@/hooks/useEmployeesList";

export function Employees() {
  const [query, setQuery] = useState('');
  const { employees: employeeList, loading, error } = useEmployeesList();

  const filtered = employeeList.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.role.toLowerCase().includes(query.toLowerCase()) ||
      e.department.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Employees</h1>
        <p className="text-muted-foreground mt-1">View and manage employee profiles</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm">
          Could not load from Firestore. Showing local data. {error.message}
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-input-background rounded-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/employee/${employee.id}`} className="block">
              <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="flex flex-col items-center text-center">
                  {/* Themed avatar with hover scale effect */}
                  <motion.div
                    className="mb-3"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <EmployeeAvatar
                      name={employee.name}
                      avatarIndex={employee.avatarIndex}
                      size="md"
                      photoUrl={employee.photoUrl}
                    />
                  </motion.div>

                  <h3 className="text-sm mb-1" style={{ fontWeight: 600 }}>
                    {employee.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">{employee.role}</p>
                  <p className="text-xs text-muted-foreground/60 mb-2">{employee.department}</p>

                  <div className="w-full pt-3 border-t border-border mt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Sentiment</span>
                      <span
                        className={`font-semibold ${
                          employee.sentiment >= 85 ? 'text-chart-2' :
                          employee.sentiment >= 75 ? 'text-primary' :
                          'text-destructive'
                        }`}
                      >
                        {employee.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-muted-foreground">Risk Level</span>
                      <span
                        className={`font-semibold ${
                          employee.risk === 'Low' ? 'text-green-600' :
                          employee.risk === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
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

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No employees found matching "{query}"
        </div>
      )}
    </div>
  );
}
