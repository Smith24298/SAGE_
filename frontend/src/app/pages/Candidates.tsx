import Link from 'next/link';
import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { useEmployeesList } from '@/hooks/useEmployeesList';

export function Candidates() {
  const [query, setQuery] = useState('');
  const { employees, loading, error } = useEmployeesList();

  const filtered = employees.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(query.toLowerCase()) ||
      candidate.role.toLowerCase().includes(query.toLowerCase()) ||
      candidate.department.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Candidates</h1>
        <p className="text-muted-foreground mt-1">Recruiter-safe candidate pipeline with limited profile access</p>
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
            placeholder="Search candidates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((candidate, index) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/employee/${candidate.id}`} className="block">
              <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    className="mb-3"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <EmployeeAvatar
                      name={candidate.name}
                      avatarIndex={candidate.avatarIndex}
                      size="md"
                      photoUrl={candidate.photoUrl}
                    />
                  </motion.div>

                  <h3 className="text-sm mb-1" style={{ fontWeight: 600 }}>
                    {candidate.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">{candidate.role}</p>
                  <p className="text-xs text-muted-foreground/60">{candidate.department}</p>

                  <div className="w-full pt-3 border-t border-border mt-3 text-left">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserPlus className="w-3.5 h-3.5" />
                      Candidate profile view
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
          No candidates found matching "{query}"
        </div>
      )}
    </div>
  );
}
