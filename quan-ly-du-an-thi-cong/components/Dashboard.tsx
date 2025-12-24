
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Activity, Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  // Aggregate data for Status Chart
  const statusData = [
    { name: 'Đang thi công', value: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length },
    { name: 'Hoàn thành', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length },
    { name: 'Chậm tiến độ', value: projects.filter(p => p.status === ProjectStatus.DELAYED).length },
    { name: 'Kế hoạch', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length },
  ].filter(d => d.value > 0);

  // Detailed Cash Flow Data
  const cashFlowData = projects.map(p => {
    const pendingAmount = p.financials
        .filter(f => f.status === 'Pending' || f.status === 'Overdue')
        .reduce((sum, item) => sum + item.amount, 0);
    const remaining = Math.max(0, p.budget - p.spent - pendingAmount);

    return {
      name: p.code,
      fullName: p.name,
      paid: p.spent,
      pending: pendingAmount,
      remaining: remaining,
      total: p.budget
    };
  });

  // Calculate Progress Trend Data (Last 6 months)
  const generateProgressTrend = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date: d,
        label: `Tháng ${d.getMonth() + 1}`,
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      });
    }

    return months.map(m => {
      // Find tasks that should have been active or completed by this month
      const relevantTasks = projects.flatMap(p => p.tasks).filter(t => {
        const taskEnd = new Date(t.endDate);
        const monthEnd = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0);
        return taskEnd <= monthEnd;
      });

      // Calculate average progress of these tasks
      const avgProgress = relevantTasks.length > 0 
        ? Math.round(relevantTasks.reduce((sum, t) => sum + t.progress, 0) / relevantTasks.length)
        : 0;

      return {
        name: m.label,
        progress: avgProgress
      };
    });
  };

  const trendData = generateProgressTrend();

  const totalWorkers = projects.reduce((acc, curr) => acc + curr.workers.length, 0);
  const totalBudget = projects.reduce((acc, curr) => acc + curr.budget, 0);
  const totalSpent = projects.reduce((acc, curr) => acc + curr.spent, 0);
  const criticalIssues = projects.filter(p => p.status === ProjectStatus.DELAYED).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-lg rounded-xl">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-500 w-32">{entry.name}:</span>
              <span className="font-mono font-medium">
                {entry.name.includes('Tiến độ') ? `${entry.value}%` : `${(entry.value).toLocaleString()} đ`}
              </span>
            </div>
          ))}
          {payload[0].payload.total && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-700">
               <span>Tổng ngân sách:</span>
               <span>{(payload[0].payload.total).toLocaleString()} đ</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} Tỷ`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(0)} Tr`;
      return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Tổng dự án</p>
            <h2 className="text-2xl font-bold text-slate-800">{projects.length}</h2>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Nhân lực tại CT</p>
            <h2 className="text-2xl font-bold text-slate-800">{totalWorkers}</h2>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Ngân sách (Tỷ VNĐ)</p>
            <h2 className="text-2xl font-bold text-slate-800">{(totalSpent/1e9).toFixed(1)} / {(totalBudget/1e9).toFixed(1)}</h2>
          </div>
          <div className="p-3 bg-purple-50 rounded-full text-purple-600">
            <DollarSign size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Dự án chậm trễ</p>
            <h2 className="text-2xl font-bold text-red-600">{criticalIssues}</h2>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart (New Section) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={20} />
                Xu hướng tiến độ trung bình
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">6 Tháng gần đây</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, "Tiến độ trung bình"]}
                />
                <Line 
                    type="monotone" 
                    dataKey="progress" 
                    name="Tiến độ trung bình"
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Trạng thái dự án</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Cash Flow Chart (Full width at bottom of grid) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Chi tiết dòng tiền & Ngân sách</h3>
              <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Đã chi</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> Chờ thanh toán</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300"></span> Còn lại</div>
              </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="paid" stackId="a" name="Đã chi" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={40} />
                <Bar dataKey="pending" stackId="a" name="Chờ thanh toán" fill="#eab308" barSize={40} />
                <Bar dataKey="remaining" stackId="a" name="Ngân sách còn lại" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
