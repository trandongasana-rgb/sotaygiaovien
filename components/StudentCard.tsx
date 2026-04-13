
import React from 'react';
import { User, Cake, TrendingUp, TrendingDown, Clock, XCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface StudentCardProps {
  student: Student;
  currentDate: string;
  onAttendance: (status: AttendanceStatus) => void;
  onPoints: (delta: number) => void;
  onSelect: () => void;
  onNotify: (type: 'Absent' | 'Late' | 'Good' | 'Bad') => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, currentDate, onAttendance, onPoints, onSelect, onNotify }) => {
  const status = student.attendance[currentDate] || 'Present';
  const isBirthday = React.useMemo(() => {
    if (!student.birthday) return false;
    const today = new Date();
    const bday = new Date(student.birthday);
    return today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth();
  }, [student.birthday]);

  const getStatusColor = () => {
    switch (status) {
      case 'Absent': return 'bg-red-50 border-red-200';
      case 'Late': return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div 
      className={`relative p-4 border rounded-xl shadow-sm transition-all hover:shadow-md ${getStatusColor()} ${isBirthday ? 'ring-2 ring-yellow-400' : ''}`}
    >
      {isBirthday && (
        <div className="absolute -top-3 -right-2 bg-yellow-400 text-white p-1 rounded-full animate-bounce shadow-lg">
          <Cake size={16} />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onSelect}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${student.gender === 'Nam' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
            <User size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 line-clamp-1">{student.name}</h3>
            <p className="text-xs text-gray-500">{student.studentId}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`text-sm font-bold px-2 py-1 rounded-lg ${student.points >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {student.points > 0 ? '+' : ''}{student.points}
          </div>
          {/* Nút gửi thông báo nhanh */}
          <button 
            onClick={(e) => { e.stopPropagation(); onNotify(status === 'Absent' ? 'Absent' : status === 'Late' ? 'Late' : student.points > 0 ? 'Good' : 'Bad'); }}
            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            title="Gửi thông báo cho PH"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button 
          onClick={() => onAttendance('Present')}
          className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${status === 'Present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <CheckCircle size={16} />
          <span className="text-[10px] mt-1">Đủ</span>
        </button>
        <button 
          onClick={() => onAttendance('Late')}
          className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${status === 'Late' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Clock size={16} />
          <span className="text-[10px] mt-1">Muộn</span>
        </button>
        <button 
          onClick={() => onAttendance('Absent')}
          className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${status === 'Absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <XCircle size={16} />
          <span className="text-[10px] mt-1">Vắng</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onPoints(1)}
          className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
        >
          <TrendingUp size={14} /> +1
        </button>
        <button 
          onClick={() => onPoints(-1)}
          className="flex-1 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
        >
          <TrendingDown size={14} /> -1
        </button>
      </div>
    </div>
  );
};

export default StudentCard;
