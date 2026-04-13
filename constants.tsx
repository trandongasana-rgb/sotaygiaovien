
import React from 'react';
import { LayoutDashboard, Users, UserCheck, Wallet, CheckSquare, Sparkles, BookOpen } from 'lucide-react';
import { ViewMode } from './types';

export const NAV_ITEMS = [
  { id: ViewMode.Dashboard, label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
  { id: ViewMode.Students, label: 'Học sinh', icon: <Users size={20} /> },
  { id: ViewMode.Classroom, label: 'Lớp & Nề nếp', icon: <UserCheck size={20} /> },
  { id: ViewMode.Finance, label: 'Quỹ lớp', icon: <Wallet size={20} /> },
  { id: ViewMode.Tasks, label: 'Việc cần làm', icon: <CheckSquare size={20} /> },
  { id: ViewMode.Diary, label: 'Sổ chủ nhiệm', icon: <BookOpen size={20} /> },
  { id: ViewMode.AI, label: 'Trợ lý AI', icon: <Sparkles size={20} /> },
];

export const INITIAL_STUDENTS = [
  { id: '1', studentId: 'HS001', name: 'Nguyễn Văn An', gender: 'Nam', birthday: '2012-05-15', parentPhone: '0901234567', notes: 'Học sinh giỏi Toán', points: 10, attendance: {} },
  { id: '2', studentId: 'HS002', name: 'Trần Thị Bình', gender: 'Nữ', birthday: '2012-10-20', parentPhone: '0912345678', notes: 'Hăng hái phát biểu', points: 15, attendance: {} },
  { id: '3', studentId: 'HS003', name: 'Lê Hoàng Cường', gender: 'Nam', birthday: '2012-03-10', parentPhone: '0923456789', notes: 'Cần chú ý nề nếp', points: -5, attendance: {} },
];
