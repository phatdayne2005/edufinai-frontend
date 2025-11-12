const mockData = {
  user: {
    name: 'Nguyễn Văn A',
    avatar: '👨‍💼',
    balance: 5250000,
    income: 8000000,
    expense: 2750000,
    savingRate: 65,
    level: 12,
    points: 2450,
    rank: 15,
  },
  expenses: [
    { id: 1, type: 'EXPENSE', amount: 250000, category: 'Ăn uống', date: '2024-11-10', note: 'Nhà hàng' },
    { id: 2, type: 'EXPENSE', amount: 500000, category: 'Mua sắm', date: '2024-11-09', note: 'Quần áo' },
    { id: 3, type: 'INCOME', amount: 8000000, category: 'Lương', date: '2024-11-01', note: 'Lương tháng 11' },
    { id: 4, type: 'EXPENSE', amount: 2000000, category: 'Nhà ở', date: '2024-11-05', note: 'Tiền nhà' },
  ],
  goals: [
    { id: 1, title: 'Mua laptop mới', target: 20000000, current: 12000000, deadline: '2024-12-31', status: 'ACTIVE' },
    { id: 2, title: 'Quỹ khẩn cấp', target: 30000000, current: 25000000, deadline: '2025-06-30', status: 'ACTIVE' },
    { id: 3, title: 'Du lịch Đà Lạt', target: 5000000, current: 5000000, deadline: '2024-11-15', status: 'COMPLETED' },
  ],
  lessons: [
    { id: 1, title: 'Ngân sách cơ bản', progress: 100, total: 5, badge: '🎯', completed: true },
    { id: 2, title: 'Tiết kiệm thông minh', progress: 60, total: 5, badge: '💰', completed: false },
    { id: 3, title: 'Đầu tư cho người mới', progress: 0, total: 8, badge: '📈', completed: false },
  ],
  challenges: [
    { id: 1, title: 'Tiết kiệm 100k/ngày', progress: 7, target: 30, reward: 500, type: 'daily' },
    { id: 2, title: 'Hoàn thành 3 bài học', progress: 2, target: 3, reward: 1000, type: 'weekly' },
    { id: 3, title: 'Không chi tiêu lãng phí', progress: 5, target: 7, reward: 2000, type: 'weekly' },
  ],
  leaderboard: [
    { rank: 1, name: 'Trần Thị B', points: 5200, avatar: '👩' },
    { rank: 2, name: 'Lê Văn C', points: 4800, avatar: '👨' },
    { rank: 3, name: 'Phạm Thị D', points: 3900, avatar: '👩' },
    { rank: 15, name: 'Nguyễn Văn A', points: 2450, avatar: '👨‍💼', isMe: true },
  ],
  chartData: {
    spending: [
      { name: 'Ăn uống', value: 1200000, color: '#FF6384' },
      { name: 'Mua sắm', value: 800000, color: '#36A2EB' },
      { name: 'Nhà ở', value: 2000000, color: '#FFCE56' },
      { name: 'Di chuyển', value: 500000, color: '#4BC0C0' },
      { name: 'Giải trí', value: 300000, color: '#9966FF' },
    ],
    monthly: [
      { month: 'T7', income: 8000000, expense: 4500000 },
      { month: 'T8', income: 8000000, expense: 5200000 },
      { month: 'T9', income: 8500000, expense: 4800000 },
      { month: 'T10', income: 8000000, expense: 5500000 },
      { month: 'T11', income: 8000000, expense: 2750000 },
    ],
  },
};

export default mockData;

