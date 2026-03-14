import { Card } from "../components/ui/card";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { departments } from "../data/departments";

export function Departments() {
  const [query, setQuery] = useState('');

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.head.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Departments</h1>
        <p className="text-muted-foreground mt-1">View and manage departmental analytics</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-input-background rounded-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search departments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((dept, index) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/department/${dept.id}`} className="block h-full">
              <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg mb-1" style={{ fontWeight: 700 }}>
                    {dept.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Head: {dept.head}</p>
                </div>
                
                <div className="w-full pt-3 border-t border-border mt-auto">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Employees</span>
                    <span className="font-semibold">{dept.employeeCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Engagement</span>
                    <span
                      className={`font-semibold ${
                        dept.engagementScore >= 85 ? 'text-chart-2' :
                        dept.engagementScore >= 75 ? 'text-primary' :
                        'text-destructive'
                      }`}
                    >
                      {dept.engagementScore}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attrition Risk</span>
                    <span
                      className={`font-semibold ${
                        dept.attritionRisk === 'Low' ? 'text-green-600' :
                        dept.attritionRisk === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}
                    >
                      {dept.attritionRisk}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No departments found matching "{query}"
        </div>
      )}
    </div>
  );
}
