// Shared employee data used across Employees list + EmployeeProfile pages

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  sentiment: number;
  risk: RiskLevel;
  manager: string;
  dateOfJoining: string;
  employmentType: string;
  location: string;
  employeeId: string;
  // Compensation
  baseSalary: string;
  bonus: string;
  stockOptions: string;
  totalCompensation: string;
  lastRevision: string;
  nextReview: string;
  // Avatar color index (picks from themed palette)
  avatarIndex: number;
}

/** Theme-matched avatar color palettes — primary, chart, and accent tones */
export const AVATAR_PALETTES = [
  { bg: '#e1634a', text: '#ffffff' }, // primary red-orange
  { bg: '#6b9080', text: '#ffffff' }, // chart-2 sage green
  { bg: '#a4b8c4', text: '#414240' }, // chart-3 muted blue
  { bg: '#f4a261', text: '#414240' }, // chart-4 warm amber
  { bg: '#e76f51', text: '#ffffff' }, // chart-5 coral
  { bg: '#8d6a9f', text: '#ffffff' }, // soft purple accent
  { bg: '#3d7a8a', text: '#ffffff' }, // teal accent
  { bg: '#c47d3e', text: '#ffffff' }, // warm brown
];

export const employees: Employee[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    sentiment: 70,
    risk: 'Medium',
    manager: 'Michael Chen',
    dateOfJoining: 'Jan 15, 2022',
    employmentType: 'Full-time',
    location: 'San Francisco, CA',
    employeeId: 'EMP-2847',
    baseSalary: '$105,000',
    bonus: '$15,000',
    stockOptions: '$25,000',
    totalCompensation: '$145,000',
    lastRevision: 'Jan 2026',
    nextReview: 'Jul 2026',
    avatarIndex: 0,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Engineering Manager',
    department: 'Engineering',
    sentiment: 85,
    risk: 'Low',
    manager: 'Jennifer Lee',
    dateOfJoining: 'Mar 3, 2020',
    employmentType: 'Full-time',
    location: 'San Francisco, CA',
    employeeId: 'EMP-1032',
    baseSalary: '$145,000',
    bonus: '$22,000',
    stockOptions: '$40,000',
    totalCompensation: '$207,000',
    lastRevision: 'Feb 2026',
    nextReview: 'Aug 2026',
    avatarIndex: 2,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Product Designer',
    department: 'Design',
    sentiment: 92,
    risk: 'Low',
    manager: 'Karen Patel',
    dateOfJoining: 'Jun 10, 2021',
    employmentType: 'Full-time',
    location: 'Austin, TX',
    employeeId: 'EMP-3451',
    baseSalary: '$98,000',
    bonus: '$12,000',
    stockOptions: '$18,000',
    totalCompensation: '$128,000',
    lastRevision: 'Dec 2025',
    nextReview: 'Jun 2026',
    avatarIndex: 3,
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Sales Director',
    department: 'Sales',
    sentiment: 78,
    risk: 'Low',
    manager: 'Jennifer Lee',
    dateOfJoining: 'Aug 22, 2019',
    employmentType: 'Full-time',
    location: 'New York, NY',
    employeeId: 'EMP-0891',
    baseSalary: '$135,000',
    bonus: '$35,000',
    stockOptions: '$30,000',
    totalCompensation: '$200,000',
    lastRevision: 'Jan 2026',
    nextReview: 'Jul 2026',
    avatarIndex: 1,
  },
  {
    id: 5,
    name: 'Lisa Wang',
    role: 'Marketing Manager',
    department: 'Marketing',
    sentiment: 88,
    risk: 'Low',
    manager: 'Karen Patel',
    dateOfJoining: 'Nov 5, 2021',
    employmentType: 'Full-time',
    location: 'Seattle, WA',
    employeeId: 'EMP-3782',
    baseSalary: '$110,000',
    bonus: '$18,000',
    stockOptions: '$20,000',
    totalCompensation: '$148,000',
    lastRevision: 'Mar 2026',
    nextReview: 'Sep 2026',
    avatarIndex: 4,
  },
  {
    id: 6,
    name: 'James Wilson',
    role: 'Software Engineer',
    department: 'Engineering',
    sentiment: 65,
    risk: 'High',
    manager: 'Michael Chen',
    dateOfJoining: 'Apr 18, 2023',
    employmentType: 'Full-time',
    location: 'Remote',
    employeeId: 'EMP-4512',
    baseSalary: '$88,000',
    bonus: '$8,000',
    stockOptions: '$12,000',
    totalCompensation: '$108,000',
    lastRevision: 'Nov 2025',
    nextReview: 'May 2026',
    avatarIndex: 5,
  },
  {
    id: 7,
    name: 'Maria Garcia',
    role: 'HR Business Partner',
    department: 'HR',
    sentiment: 90,
    risk: 'Low',
    manager: 'Jennifer Lee',
    dateOfJoining: 'Sep 1, 2020',
    employmentType: 'Full-time',
    location: 'Chicago, IL',
    employeeId: 'EMP-2103',
    baseSalary: '$95,000',
    bonus: '$10,000',
    stockOptions: '$15,000',
    totalCompensation: '$120,000',
    lastRevision: 'Jan 2026',
    nextReview: 'Jul 2026',
    avatarIndex: 6,
  },
  {
    id: 8,
    name: 'Robert Taylor',
    role: 'Finance Analyst',
    department: 'Finance',
    sentiment: 72,
    risk: 'Medium',
    manager: 'Jennifer Lee',
    dateOfJoining: 'Feb 14, 2022',
    employmentType: 'Full-time',
    location: 'Boston, MA',
    employeeId: 'EMP-3290',
    baseSalary: '$92,000',
    bonus: '$11,000',
    stockOptions: '$10,000',
    totalCompensation: '$113,000',
    lastRevision: 'Feb 2026',
    nextReview: 'Aug 2026',
    avatarIndex: 7,
  },
];

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Get employee by id */
export function getEmployeeById(id: number): Employee | undefined {
  return employees.find((e) => e.id === id);
}
