import React, { useState } from 'react';
import { Plus, Target, CheckCircle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';

const tabs = [
  { id: 'expense', label: 'Thu chi' },
  { id: 'goals', label: 'Mục tiêu' },
  { id: 'reports', label: 'Báo cáo' },
];

const FinancePage = () => {
  const { expenses, goals, chartData } = useApp();
  const [activeTab, setActiveTab] = useState('expense');
  const [transitionDirection, setTransitionDirection] = useState('forward');

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextIndex = tabs.findIndex((t) => t.id === nextTab);
    setTransitionDirection(nextIndex > currentIndex ? 'forward' : 'backward');
    setActiveTab(nextTab);
  };

  return (
    <div style={styles.page}>
      <Header title="Tài chính" subtitle="Quản lý thu chi & mục tiêu" />

      <div style={styles.tabNav}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === id ? styles.tabButtonActive : {}),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={activeTab} className={`tab-transition tab-transition--${transitionDirection}`}>
        {activeTab === 'expense' && (
          <div>
            <button type="button" style={{ ...styles.addButton, backgroundImage: 'var(--gradient-brand)' }}>
              <Plus size={20} />
              Thêm giao dịch
            </button>
            <div style={styles.section}>
              {expenses.map((exp) => (
                <div key={exp.id} style={styles.expenseItem}>
                  <div style={styles.expenseLeft}>
                    <span style={styles.expenseCategory}>{exp.category}</span>
                    <span style={styles.expenseNote}>{exp.note}</span>
                    <span style={styles.expenseDate}>{exp.date}</span>
                  </div>
                  <span
                    style={{
                      ...styles.expenseAmount,
                      color: exp.type === 'EXPENSE' ? '#F44336' : '#4CAF50',
                    }}
                  >
                    {exp.type === 'EXPENSE' ? '-' : '+'}
                    {exp.amount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <button type="button" style={{ ...styles.addButton, backgroundImage: 'var(--gradient-brand)' }}>
              <Plus size={20} />
              Tạo mục tiêu mới
            </button>
            <div style={styles.section}>
              {goals.map((goal) => (
                <div key={goal.id} style={styles.goalCardLarge}>
                  <div style={styles.goalStatus}>
                    {goal.status === 'COMPLETED' ? (
                      <CheckCircle size={20} color="var(--color-success)" />
                    ) : (
                      <Target size={20} color="var(--color-primary)" />
                    )}
                    <span
                      style={{
                        ...styles.goalStatusText,
                        color: goal.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-primary)',
                      }}
                    >
                      {goal.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                    </span>
                  </div>
                  <h4 style={styles.goalCardTitle}>{goal.title}</h4>
                  <div style={styles.goalProgress}>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span style={styles.goalPercent}>{Math.round((goal.current / goal.target) * 100)}%</span>
                  </div>
                  <div style={styles.goalDetails}>
                    <span>
                      {goal.current.toLocaleString('vi-VN')}đ / {goal.target.toLocaleString('vi-VN')}đ
                    </span>
                    <span>📅 {goal.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>Chi tiêu theo danh mục</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.spending}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${(entry.value / 1000000).toFixed(1)}M`}
                  >
                    {chartData.spending.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>Thu chi theo tháng</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-success)" name="Thu nhập" />
                  <Bar dataKey="expense" fill="var(--color-danger)" name="Chi tiêu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePage;
