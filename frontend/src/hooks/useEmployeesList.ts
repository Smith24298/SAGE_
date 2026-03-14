import { useEffect, useState } from 'react';
import { employees } from '@/app/data/employees';
import type { Employee } from '@/app/data/employees';
import { listEmployeesFromFirestore, type EmployeeListItem } from '@/lib/employeeFirestore';

export interface UseEmployeesListResult {
  employees: (Employee & { photoUrl?: string | null })[];
  loading: boolean;
  error: Error | null;
  fromFirestore: boolean;
}

export function useEmployeesList(): UseEmployeesListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromFirestore, setFromFirestore] = useState(false);
  const [list, setList] = useState<(Employee & { photoUrl?: string | null })[]>(employees);

  useEffect(() => {
    let cancelled = false;
    setList(employees);
    setFromFirestore(false);

    listEmployeesFromFirestore()
      .then((firestoreList: EmployeeListItem[]) => {
        if (cancelled) return;
        if (firestoreList.length > 0) {
          setList(
            firestoreList.map((e) => ({
              id: e.id,
              name: e.name,
              role: e.role,
              department: e.department,
              sentiment: e.sentiment,
              risk: e.risk,
              manager: e.manager,
              dateOfJoining: e.dateOfJoining,
              employmentType: e.employmentType,
              location: e.location,
              employeeId: e.employeeId,
              baseSalary: e.baseSalary,
              bonus: e.bonus,
              stockOptions: e.stockOptions,
              totalCompensation: e.totalCompensation,
              lastRevision: e.lastRevision,
              nextReview: e.nextReview,
              avatarIndex: e.avatarIndex,
              photoUrl: e.photoUrl ?? null,
            }))
          );
          setFromFirestore(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { employees: list, loading, error, fromFirestore };
}
