
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, X, Bell, Search, Plus, 
  Trash2, Download, Upload, Info,
  MessageSquare, Send, Sparkles, Loader2,
  PieChart as PieChartIcon, Cake, Calendar, Book,
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  FileText, History, Wallet, CheckSquare, Users, MessageCircle, Copy, ExternalLink, LogOut
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  Student, Activity, Transaction, Task, ViewMode, AttendanceStatus, DiaryEntry 
} from './types';
import { NAV_ITEMS, INITIAL_STUDENTS } from './constants';
import { analyzeStudent, generateTaskChecklist, chatWithAI, summarizeDiary, draftNotification } from './services/geminiService';
import StudentCard from './components/StudentCard';
import Auth from './components/Auth';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- State ---
  const [view, setView] = useState<ViewMode>(ViewMode.Dashboard);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  
  // New State for Notifications
  const [notificationModal, setNotificationModal] = useState<{ student: Student, text: string, type: string } | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saved = (key: string) => localStorage.getItem(key);
    setStudents(JSON.parse(saved('gvcn_students') || 'null') || INITIAL_STUDENTS);
    setActivities(JSON.parse(saved('gvcn_activities') || '[]'));
    setTransactions(JSON.parse(saved('gvcn_transactions') || '[]'));
    setTasks(JSON.parse(saved('gvcn_tasks') || '[]'));
    setDiaryEntries(JSON.parse(saved('gvcn_diary') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('gvcn_students', JSON.stringify(students));
    localStorage.setItem('gvcn_activities', JSON.stringify(activities));
    localStorage.setItem('gvcn_transactions', JSON.stringify(transactions));
    localStorage.setItem('gvcn_tasks', JSON.stringify(tasks));
    localStorage.setItem('gvcn_diary', JSON.stringify(diaryEntries));
  }, [students, activities, transactions, tasks, diaryEntries]);

  const today = new Date().toISOString().split('T')[0];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  // --- Handlers ---
  const handleNotify = async (student: Student, type: 'Absent' | 'Late' | 'Good' | 'Bad') => {
    setIsLoading(true);
    const text = await draftNotification(student, type);
    setNotificationModal({ student, text, type });
    setIsLoading(false);
  };

  const sendZalo = (phone: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Đã sao chép nội dung tin nhắn! Đang mở Zalo...");
      window.open(`https://zalo.me/${phone}`, '_blank');
    });
  };

  const sendSMS = (phone: string, text: string) => {
    window.location.href = `sms:${phone}?body=${encodeURIComponent(text)}`;
  };

  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStudent: Student = {
      id: Date.now().toString(),
      studentId: `HS${(students.length + 1).toString().padStart(3, '0')}`,
      name: formData.get('name') as string,
      gender: formData.get('gender') as any,
      birthday: formData.get('birthday') as string,
      parentPhone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
      points: 0,
      attendance: {}
    };
    setStudents([...students, newStudent]);
    e.currentTarget.reset();
  };

  const handleImportCSV = () => {
    const raw = prompt("Dán dữ liệu học sinh (Định dạng: Tên, Giới tính, Ngày sinh, SĐT). Mỗi dòng 1 học sinh:");
    if (!raw) return;
    const rows = raw.split('\n');
    const newStudents: Student[] = rows.map((row, index) => {
      const parts = row.split(',').map(s => s.trim());
      return {
        id: (Date.now() + index).toString(),
        studentId: `HS${(students.length + index + 1).toString().padStart(3, '0')}`,
        name: parts[0] || "Học sinh mới",
        gender: (parts[1] === "Nữ" ? "Nữ" : "Nam") as any,
        birthday: parts[2] || "2012-01-01",
        parentPhone: parts[3] || "0900000000",
        notes: "",
        points: 0,
        attendance: {}
      };
    });
    setStudents([...students, ...newStudents]);
    alert(`Đã nhập thành công ${newStudents.length} học sinh!`);
  };

  const deleteStudent = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      setStudents(students.filter(s => s.id !== id));
      setActivities(activities.filter(a => a.studentId !== id));
    }
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) return { ...s, attendance: { ...s.attendance, [today]: status } };
      return s;
    }));
    const student = students.find(s => s.id === studentId);
    if (student) {
      setActivities([{
        id: Date.now().toString(),
        studentId,
        studentName: student.name,
        type: 'Attendance',
        content: `Điểm danh: ${status === 'Present' ? 'Có mặt' : status === 'Late' ? 'Đi muộn' : 'Vắng mặt'}`,
        timestamp: Date.now()
      }, ...activities]);
    }
  };

  const changePoints = (studentId: string, delta: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) return { ...s, points: s.points + delta };
      return s;
    }));
    const student = students.find(s => s.id === studentId);
    if (student) {
      setActivities([{
        id: Date.now().toString(),
        studentId,
        studentName: student.name,
        type: 'PointChange',
        content: `${delta > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(delta)} điểm thi đua`,
        value: delta,
        timestamp: Date.now()
      }, ...activities]);
    }
  };

  const addTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setTransactions([{
      id: Date.now().toString(),
      type: formData.get('type') as any,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      date: formData.get('date') as string
    }, ...transactions]);
    e.currentTarget.reset();
  };

  const addTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setTasks([{
      id: Date.now().toString(),
      title: formData.get('title') as string,
      completed: false,
      priority: formData.get('priority') as any,
      dueDate: formData.get('dueDate') as string
    }, ...tasks]);
    e.currentTarget.reset();
  };

  const addDiaryEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setDiaryEntries([{
      id: Date.now().toString(),
      date: formData.get('date') as string,
      content: formData.get('content') as string,
      mood: formData.get('mood') as any,
    }, ...diaryEntries]);
    e.currentTarget.reset();
  };

  const handleAiAnalysis = async (student: Student) => {
    setIsLoading(true);
    const studentActivities = activities.filter(a => a.studentId === student.id);
    const result = await analyzeStudent(student, studentActivities);
    setAiAnalysis(result);
    setActiveStudent(student);
    setIsLoading(false);
  };

  const handleAiDiarySummary = async () => {
    if (diaryEntries.length === 0) return alert("Chưa có ghi chép nào để tổng kết!");
    setIsLoading(true);
    const summary = await summarizeDiary(diaryEntries.slice(0, 10));
    alert("Báo cáo tổng kết GVCN AI:\n\n" + summary);
    setIsLoading(false);
  };

  // --- Stats Helpers ---
  const stats = useMemo(() => {
    const total = students.length;
    const vắng = students.filter(s => s.attendance[today] === 'Absent').length;
    const muộn = students.filter(s => s.attendance[today] === 'Late').length;
    const present = students.filter(s => s.attendance[today] === 'Present' || !s.attendance[today]).length;
    const fund = transactions.reduce((acc, tx) => tx.type === 'Income' ? acc + tx.amount : acc - tx.amount, 0);
    const birthdaysToday = students.filter(s => {
      if (!s.birthday) return false;
      const b = new Date(s.birthday);
      const t = new Date();
      return b.getDate() === t.getDate() && b.getMonth() === t.getMonth();
    });
    const chartData = [...students].sort((a, b) => b.points - a.points).slice(0, 10).map(s => ({ name: s.name, points: s.points }));
    return { total, vắng, muộn, present, fund, birthdaysToday, chartData };
  }, [students, transactions, today]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Views ---
  const renderDashboard = () => (
    <div className="space-y-6">
      {stats.birthdaysToday.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-xl animate-pulse">
          <div className="flex items-center gap-3">
            <Cake className="text-yellow-600" />
            <div><p className="font-bold text-yellow-800">Chúc mừng sinh nhật!</p><p className="text-sm text-yellow-700">{stats.birthdaysToday.map(s => s.name).join(', ')}</p></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sĩ số', value: stats.total, color: 'blue', icon: <Users size={20} /> },
          { label: 'Có mặt', value: stats.present, color: 'green', icon: <CheckCircle size={20} /> },
          { label: 'Vắng/Muộn', value: `${stats.vắng}/${stats.muộn}`, color: 'red', icon: <Clock size={20} /> },
          { label: 'Quỹ lớp', value: stats.fund.toLocaleString() + 'đ', color: 'purple', icon: <Wallet size={20} /> }
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-500 uppercase">{item.label}</p><p className={`text-3xl font-bold mt-1 text-${item.color}-600`}>{item.value}</p></div>
            <div className={`p-3 rounded-xl bg-${item.color}-50 text-${item.color}-500`}>{item.icon}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800"><TrendingUp size={20} className="text-blue-500" />Top 10 Thi đua</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                  {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.points >= 0 ? '#10b981' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800"><History size={20} className="text-orange-500" />Dòng thời gian</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
            {activities.length === 0 ? <p className="text-center text-gray-400 py-10">Chưa có hoạt động</p> : (
              <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="relative pl-8">
                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${activity.type === 'PointChange' ? (activity.value! > 0 ? 'bg-green-500' : 'bg-red-500') : activity.type === 'Attendance' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <div className="text-sm font-semibold text-gray-800">{activity.studentName}</div>
                    <div className="text-sm text-gray-600">{activity.content}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(activity.timestamp).toLocaleTimeString('vi-VN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Mobile Toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border">
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">G</div>
            <div><h1 className="font-black text-lg text-gray-800 leading-none">GVCN AI</h1><p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Classroom Pro</p></div>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">GV</div>
              <div>
                <p className="text-sm font-bold">{user?.email?.split('@')[0] || 'Giáo viên'}</p>
                <p className="text-xs text-gray-500">Lớp 6A1</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8 min-h-screen w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{NAV_ITEMS.find(i => i.id === view)?.label}</h2><p className="text-sm text-gray-500">Hệ thống Quản lý Lớp học Thông minh 4.0</p></div>
          <div className="flex items-center gap-3"><div className="hidden md:flex flex-col items-end"><span className="text-xs font-bold text-gray-400 uppercase">Trạng thái</span><span className="text-xs font-bold text-green-500 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> TRỰC TUYẾN</span></div></div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {view === ViewMode.Dashboard && renderDashboard()}
          {view === ViewMode.Students && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Tìm tên hoặc mã..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" /></div>
                <div className="flex gap-2"><button onClick={handleImportCSV} className="bg-gray-100 px-4 py-2 rounded-xl font-semibold border flex items-center gap-2"><Upload size={18} /> Nhập liệu</button><button onClick={() => document.getElementById('add-student-modal')?.classList.remove('hidden')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2"><Plus size={18} /> Thêm mới</button></div>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-4 text-xs font-bold uppercase">Mã HS</th><th className="p-4 text-xs font-bold uppercase">Họ tên</th><th className="p-4 text-xs font-bold uppercase">Giới tính</th><th className="p-4 text-xs font-bold uppercase">SĐT PH</th><th className="p-4 text-xs font-bold uppercase">Thao tác</th></tr></thead><tbody className="divide-y">{filteredStudents.map(s => (<tr key={s.id} className="hover:bg-gray-50"><td className="p-4 text-sm">{s.studentId}</td><td className="p-4 text-sm font-bold">{s.name}</td><td className="p-4 text-sm">{s.gender}</td><td className="p-4 text-sm">{s.parentPhone}</td><td className="p-4 flex gap-2"><button onClick={() => handleAiAnalysis(s)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><Sparkles size={18} /></button><button onClick={() => handleNotify(s, 'Good')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><MessageCircle size={18} /></button><button onClick={() => deleteStudent(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
            </div>
          )}
          {view === ViewMode.Classroom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredStudents.map(s => <StudentCard key={s.id} student={s} currentDate={today} onAttendance={(status) => updateAttendance(s.id, status)} onPoints={(delta) => changePoints(s.id, delta)} onSelect={() => handleAiAnalysis(s)} onNotify={(type) => handleNotify(s, type)} />)}
            </div>
          )}
          {view === ViewMode.Finance && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit space-y-4"><div className="bg-blue-600 p-6 rounded-xl text-white"><p className="text-xs uppercase opacity-80 font-bold">Quỹ lớp</p><p className="text-3xl font-black">{stats.fund.toLocaleString()}đ</p></div><form onSubmit={addTransaction} className="space-y-3"><select name="type" className="w-full p-2 border rounded-lg"><option value="Income">Thu vào (+)</option><option value="Expense">Chi ra (-)</option></select><input name="amount" type="number" placeholder="Số tiền" className="w-full p-2 border rounded-lg" required /><input name="description" placeholder="Nội dung" className="w-full p-2 border rounded-lg" required /><input name="date" type="date" defaultValue={today} className="w-full p-2 border rounded-lg" /><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Ghi sổ</button></form></div>
              <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="p-4">Ngày</th><th className="p-4">Nội dung</th><th className="p-4 text-right">Số tiền</th></tr></thead><tbody className="divide-y">{transactions.map(t => (<tr key={t.id}><td className="p-4">{t.date}</td><td className="p-4">{t.description}</td><td className={`p-4 text-right font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Income' ? '+' : '-'}{t.amount.toLocaleString()}đ</td></tr>))}</tbody></table></div>
            </div>
          )}
          {view === ViewMode.Tasks && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit"><h3 className="font-bold mb-4">Giao việc mới</h3><form onSubmit={addTask} className="space-y-3"><input name="title" placeholder="Tiêu đề..." className="w-full p-2 border rounded-lg" required /><select name="priority" className="w-full p-2 border rounded-lg"><option value="High">Cao</option><option value="Medium">Trung bình</option><option value="Low">Thấp</option></select><input name="dueDate" type="date" className="w-full p-2 border rounded-lg" /><button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Thêm</button></form></div>
              <div className="md:col-span-2 space-y-3">{tasks.map(t => (<div key={t.id} className="bg-white p-4 rounded-xl border flex items-center justify-between group"><div className="flex items-center gap-3"><input type="checkbox" checked={t.completed} onChange={() => setTasks(tasks.map(x => x.id === t.id ? {...x, completed: !x.completed} : x))} /><span className={t.completed ? 'line-through text-gray-400' : 'font-bold'}>{t.title}</span><span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded uppercase font-black">{t.priority}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={async () => { setIsLoading(true); alert((await generateTaskChecklist(t.title)).join('\n')); setIsLoading(false); }} className="text-purple-600"><Sparkles size={16}/></button><button onClick={() => setTasks(tasks.filter(x => x.id !== t.id))} className="text-red-600"><Trash2 size={16}/></button></div></div>))}</div>
            </div>
          )}
          {view === ViewMode.Diary && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit space-y-4"><h3 className="font-bold">Nhật ký hôm nay</h3><form onSubmit={addDiaryEntry} className="space-y-3"><input name="date" type="date" defaultValue={today} className="w-full p-2 border rounded-lg" /><select name="mood" className="w-full p-2 border rounded-lg"><option value="Neutral">😐 Bình thường</option><option value="Happy">😊 Hứng khởi</option><option value="Tired">😫 Mệt mỏi</option><option value="Concerned">😟 Lo lắng</option></select><textarea name="content" placeholder="Nội dung..." className="w-full p-2 border rounded-lg h-32" required></textarea><button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Lưu</button></form><button onClick={handleAiDiarySummary} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Sparkles size={18}/> Tổng kết tuần AI</button></div>
              <div className="lg:col-span-2 space-y-4">{diaryEntries.map(e => (<div key={e.id} className="bg-white p-6 rounded-2xl border shadow-sm"><div className="flex justify-between mb-2"><span className="font-bold">{e.date}</span><span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{e.mood}</span></div><p className="text-gray-600">{e.content}</p></div>))}</div>
            </div>
          )}
          {view === ViewMode.AI && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-10 rounded-3xl border shadow-sm text-center"><Sparkles size={48} className="mx-auto text-purple-600 mb-4 animate-pulse" /><h3 className="text-2xl font-black">GVCN AI Assistant</h3><p className="text-gray-500">Trợ lý hỗ trợ soạn văn bản, tư vấn tâm lý.</p></div>
              <textarea id="ai-msg" className="w-full h-40 p-4 border rounded-2xl" placeholder="Nhập yêu cầu..."></textarea>
              <button onClick={async () => { const msg = (document.getElementById('ai-msg') as HTMLTextAreaElement).value; setIsLoading(true); alert(await chatWithAI(msg, "Trợ lý ảo")); setIsLoading(false); }} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl"><Send size={20}/> Gửi yêu cầu</button>
            </div>
          )}
        </div>

        {/* Modal Thông báo Phụ huynh */}
        {notificationModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3"><MessageCircle size={24}/><h3 className="text-xl font-bold">Thông báo Phụ huynh</h3></div>
                <button onClick={() => setNotificationModal(null)}><X size={24}/></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-gray-50 rounded-2xl border text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap">
                  "{notificationModal.text}"
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => sendZalo(notificationModal.student.parentPhone, notificationModal.text)}
                    className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
                  >
                    <ExternalLink size={18} /> Gửi qua Zalo (Copy + Mở Chat)
                  </button>
                  <button 
                    onClick={() => sendSMS(notificationModal.student.parentPhone, notificationModal.text)}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                  >
                    <MessageSquare size={18} /> Gửi qua SMS (Trực tiếp)
                  </button>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(notificationModal.text); alert("Đã sao chép nội dung!"); }}
                    className="w-full py-3 text-blue-600 font-bold flex items-center justify-center gap-2"
                  >
                    <Copy size={16} /> Chỉ sao chép nội dung
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal AI Analysis */}
        {aiAnalysis && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white flex justify-between items-start">
                <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Sparkles size={32}/></div><div><h3 className="text-2xl font-black">{activeStudent?.name}</h3><p>Phân tích bởi GVCN AI</p></div></div>
                <button onClick={() => setAiAnalysis(null)}><X /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-2xl border"><p className="text-[10px] font-bold text-gray-400">XẾP LOẠI</p><p className="text-lg font-black">{aiAnalysis.rating}</p></div><div className="p-4 bg-gray-50 rounded-2xl border"><p className="text-[10px] font-bold text-gray-400">CẢM XÚC</p><p className="text-lg font-black">{aiAnalysis.sentiment}</p></div></div>
                <div className="space-y-2"><p className="font-bold flex items-center gap-2"><Info size={18} className="text-blue-600"/> Lời khuyên giáo dục</p><div className="bg-blue-50 p-4 rounded-xl text-blue-800 italic">"{aiAnalysis.advice}"</div></div>
                <button onClick={() => setAiAnalysis(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Loading */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-blue-600 animate-pulse">GVCN AI đang xử lý...</p>
          </div>
        )}

        {/* Add Student Modal */}
        <div id="add-student-modal" className="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-lg p-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Thêm học sinh</h2><button onClick={() => document.getElementById('add-student-modal')?.classList.add('hidden')}><X/></button></div><form onSubmit={(e) => { handleAddStudent(e); document.getElementById('add-student-modal')?.classList.add('hidden'); }} className="space-y-4"><input name="name" required placeholder="Tên" className="w-full p-2 border rounded-lg"/><select name="gender" className="w-full p-2 border rounded-lg"><option>Nam</option><option>Nữ</option></select><input name="birthday" type="date" required className="w-full p-2 border rounded-lg"/><input name="phone" required placeholder="SĐT Phụ huynh" className="w-full p-2 border rounded-lg"/><textarea name="notes" placeholder="Ghi chú" className="w-full p-2 border rounded-lg h-24"></textarea><button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Lưu</button></form></div></div>
      </main>
    </div>
  );
};

export default App;
