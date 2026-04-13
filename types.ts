
export type Gender = 'Nam' | 'Nữ';
export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: Gender;
  birthday: string;
  parentPhone: string;
  notes: string;
  points: number;
  attendance: Record<string, AttendanceStatus>; // date string -> status
}

export interface Activity {
  id: string;
  studentId: string;
  studentName: string;
  type: 'PointChange' | 'Attendance' | 'Note';
  content: string;
  value?: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  description: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: 'Neutral' | 'Happy' | 'Tired' | 'Concerned';
}

export enum ViewMode {
  Dashboard = 'dashboard',
  Students = 'students',
  Classroom = 'classroom',
  Finance = 'finance',
  Tasks = 'tasks',
  Diary = 'diary',
  AI = 'ai'
}
