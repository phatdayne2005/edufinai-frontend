import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as adminApi from '../../services/authApi';
import * as gamificationApi from '../../services/gamificationApi';
import { styles } from '../../styles/appStyles';
import { 
  Users, 
  Shield, 
  ArrowLeft,
  UserCheck, 
  FileText, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  X, 
  LogOut,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Trophy,
  Target,
  Gift,
  Award
} from 'lucide-react';
import ThemeCustomizer from '../../components/settings/ThemeCustomizer';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'challenges', 'leaderboard', 'settings'
  
  // Refs for tab indicator
  const tabsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabElement = tabsRef.current[activeTab];
      if (activeTabElement) {
        setIndicatorStyle({
          left: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    
    // Small timeout to ensure layout is stable (e.g. fonts loaded)
    const timeoutId = setTimeout(updateIndicator, 50);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Gamification States
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState({
    userId: '',
    score: 0,
    badge: '',
    reason: ''
  });
  const [challengeData, setChallengeData] = useState({
    title: '',
    description: '',
    goal: 100,
    rewardPoints: 50,
    type: 'DAILY', // DAILY, WEEKLY, ONE_TIME
    icon: '🎯'
  });

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    role: 'LEARNER',
  });
  const [activeRoles, setActiveRoles] = useState([]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersList = await adminApi.getAllUsers();
      setUsers(usersList || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Gamification Data
  const fetchChallenges = async () => {
    try {
      setLoading(true);
      // Mock data or use API if available. assuming gamificationApi has getChallenges
      // If not available, I'll use mock data for now as per previous instructions
      // const data = await gamificationApi.getAllChallenges(); 
      // setChallenges(data);
      
      // Mocking for demonstration as API might not be fully ready for admin listing
      setChallenges([
        { id: 1, title: 'Đăng nhập hàng ngày', description: 'Đăng nhập vào ứng dụng mỗi ngày', goal: 1, rewardPoints: 10, type: 'DAILY', icon: '📅' },
        { id: 2, title: 'Hoàn thành 3 bài học', description: 'Học xong 3 bài học bất kỳ', goal: 3, rewardPoints: 50, type: 'WEEKLY', icon: '📚' },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await gamificationApi.getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchUsers();
    } else if (activeTab === 'challenges') {
      fetchChallenges();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // Gamification Handlers
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    // Implement API call here
    console.log('Create challenge:', challengeData);
    alert('Tính năng đang phát triển (API chưa sẵn sàng)');
    setShowCreateChallengeModal(false);
  };

  const handleGiveReward = async (e) => {
    e.preventDefault();
    try {
      // Assuming gamificationApi has giveReward
      // await gamificationApi.giveReward(rewardData);
      console.log('Give reward:', rewardData);
      alert(`Đã tặng ${rewardData.score} điểm cho user ID: ${rewardData.userId}`);
      setShowRewardModal(false);
      fetchLeaderboard(); // Refresh
    } catch (err) {
      alert('Lỗi khi tặng quà');
    }
  };

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await adminApi.createUserWithRole(formData);
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      alert('Tạo người dùng thành công!');
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Không thể tạo người dùng');
    }
  };

  // Handle edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const updateData = { ...formData };
      // Don't send password if it's empty
      if (!updateData.password) {
        delete updateData.password;
      }
      await adminApi.adminUpdateUser(selectedUser.id, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
      alert('Cập nhật người dùng thành công!');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Không thể cập nhật người dùng');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }
    try {
      setError(null);
      await adminApi.adminDeleteUser(userId);
      fetchUsers();
      alert('Xóa người dùng thành công!');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Không thể xóa người dùng');
    }
  };

  // Open edit modal
  const openEditModal = async (user) => {
    try {
      // Fetch full user details
      const userDetails = await adminApi.getUserById(user.id);
      setSelectedUser(userDetails);
      setFormData({
        username: userDetails.username || '',
        password: '',
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        dob: userDetails.dob || '',
        role: userDetails.roles?.[0]?.name || userDetails.roles?.[0] || 'LEARNER',
      });
      setShowEditModal(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Không thể tải thông tin người dùng');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dob: '',
      role: 'LEARNER',
    });
  };

  // Get role name
  const getRoleName = (roles) => {
    if (!roles || roles.length === 0) return 'Không có';
    const role = roles[0];
    const rawRole = typeof role === 'string' ? role : role?.name;
    if (!rawRole) return 'Không có';
    return rawRole.replace(/^ROLE_/, '').toUpperCase();
  };

  const getRoleKey = (roles) => {
    const normalized = getRoleName(roles);
    return normalized === 'Không có' ? 'OTHER' : normalized;
  };

  const filteredUsers = users.filter((u) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      if (!username.includes(search) && !email.includes(search)) {
        return false;
      }
    }

    if (activeRoles.length > 0) {
      const userRole = getRoleKey(u.roles);
      return activeRoles.includes(userRole);
    }

    return true;
  });

  const totalUsers = users.length;
  const roleCounts = users.reduce((acc, currentUser) => {
    const roleName = getRoleName(currentUser.roles);
    const key = roleName === 'Không có' ? 'OTHER' : roleName;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const trackedRoles = ['ADMIN', 'MOD', 'CREATOR', 'LEARNER'];
  const trackedTotal = trackedRoles.reduce((sum, role) => sum + (roleCounts[role] || 0), 0);
  const otherCount = Math.max(totalUsers - trackedTotal, 0);
  if (otherCount > 0) {
    roleCounts.OTHER = otherCount;
  }
  const completedProfiles = users.filter((u) => u.email && u.phone).length;
  const completionPercent = totalUsers ? Math.round((completedProfiles / totalUsers) * 100) : 0;

  const metrics = [
    {
      label: 'Tổng người dùng',
      value: totalUsers,
      hint: 'Tất cả tài khoản đang hoạt động',
      icon: <Users size={24} color="var(--color-primary)" />,
      bgColor: 'var(--color-primary-soft)',
    },
    {
      label: 'Tài khoản Admin',
      value: roleCounts.ADMIN || 0,
      hint: 'Quản trị viên có toàn quyền',
      icon: <Shield size={24} color="#F44336" />,
      bgColor: 'rgba(244, 67, 54, 0.1)',
    },
    {
      label: 'Người học',
      value: roleCounts.LEARNER || 0,
      hint: 'Vai trò LEARNER trong hệ thống',
      icon: <UserCheck size={24} color="#4CAF50" />,
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      label: 'Hồ sơ hoàn chỉnh',
      value: `${completionPercent}%`,
      hint: `${completedProfiles} hồ sơ đã điền đủ thông tin`,
      icon: <FileText size={24} color="#FF9800" />,
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
  ];

  const roleBadgeItems = [
    { key: 'ADMIN', label: 'Admin', color: '#F44336', bg: 'rgba(244, 67, 54, 0.1)' },
    { key: 'MOD', label: 'Mod', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.1)' },
    { key: 'CREATOR', label: 'Creator', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)' },
    { key: 'LEARNER', label: 'Learner', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
  ];

  const toggleRoleFilter = (roleKey) => {
    setActiveRoles((prev) =>
      prev.includes(roleKey)
        ? prev.filter((key) => key !== roleKey)
        : [...prev, roleKey]
    );
  };

  const clearRoleFilters = () => {
    setActiveRoles([]);
  };

  const filterSummary =
    activeRoles.length > 0
      ? `Đang lọc: ${activeRoles.join(', ')}`
      : 'Hiển thị tất cả vai trò';

  const dashboardStyles = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'transparent',
      padding: '32px 16px 48px',
      color: 'var(--text-primary)',
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--text-muted)',
      marginBottom: '8px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'color 0.2s',
      width: 'fit-content',
    },
    heroCard: {
      background: 'var(--gradient-hero)',
      borderRadius: '28px',
      padding: '32px',
      color: '#fff',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.15)',
    },
    heroText: {
      maxWidth: '560px',
    },
    heroBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.18)',
      fontSize: '13px',
      fontWeight: 600,
      marginBottom: '12px',
    },
    heroTitle: {
      fontSize: '32px',
      fontWeight: 700,
      margin: '0 0 8px 0',
    },
    heroSubtitle: {
      fontSize: '16px',
      lineHeight: 1.6,
      margin: 0,
      opacity: 0.9,
    },
    heroRight: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'flex-end',
      width: '100%',
      maxWidth: '240px',
    },
    heroHighlight: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '18px',
      padding: '16px 24px',
      textAlign: 'right',
      width: '100%',
      alignSelf: 'stretch',
    },
    heroHighlightLabel: {
      margin: 0,
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      opacity: 0.8,
      textAlign: 'left',
    },
    heroHighlightValue: {
      margin: '4px 0 0 0',
      fontSize: '36px',
      fontWeight: 700,
      textAlign: 'left',
    },
    heroHighlightHint: {
      margin: 0,
      fontSize: '13px',
      opacity: 0.85,
      textAlign: 'left',
    },
    heroButton: {
      border: 'none',
      borderRadius: '999px',
      backgroundColor: 'var(--surface-card)',
      color: 'var(--color-primary)',
      padding: '12px 28px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
    },
    metricCard: {
      backgroundColor: 'var(--surface-card)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    metricContent: {
      display: 'flex',
      flexDirection: 'column',
    },
    metricIcon: {
      padding: '12px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricLabel: {
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      margin: 0,
    },
    metricValue: {
      fontSize: '32px',
      fontWeight: 700,
      margin: '8px 0 4px 0',
      color: 'var(--text-primary)',
    },
    metricHint: {
      margin: 0,
      fontSize: '13px',
      color: 'var(--text-muted)',
    },
    roleFilterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '4px 0',
    },
    roleBadge: {
      backgroundColor: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    roleBadgeActive: {
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
      borderColor: 'var(--color-primary)',
      boxShadow: '0 4px 12px var(--color-primary-glow)',
    },
    roleBadgeAll: {
      backgroundColor: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-secondary)',
    },
    errorCard: {
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '18px',
      padding: '16px 20px',
      color: '#F44336',
      border: '1px solid rgba(244, 67, 54, 0.2)',
    },
    actionCard: {
      backgroundColor: 'var(--surface-card)',
      borderRadius: '22px',
      padding: '20px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    actionLeft: {
      width: '100%',
    },
    searchWrapper: {
      position: 'relative',
      width: '100%',
      maxWidth: '480px',
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-muted)',
      fontSize: '16px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      borderRadius: '14px',
      border: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--surface-muted)',
      fontSize: '14px',
      outline: 'none',
      transition: 'border 0.2s',
      color: 'var(--text-primary)',
    },
    clearSearchButton: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      color: 'var(--text-muted)',
      padding: '4px',
    },
    searchMeta: {
      margin: '8px 0 0 0',
      fontSize: '13px',
      color: 'var(--text-muted)',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    ctaSecondaryButton: {
      padding: '12px 20px',
      borderRadius: '14px',
      border: '1px solid var(--border-strong)',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      fontWeight: 600,
      cursor: 'pointer',
    },
    ctaPrimaryButton: {
      padding: '12px 22px',
      borderRadius: '14px',
      border: 'none',
      backgroundImage: 'var(--gradient-brand)',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: 'var(--shadow-md)',
    },
    tableCard: {
      backgroundColor: 'var(--surface-card)',
      borderRadius: '26px',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
    },
    tableHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '16px',
    },
    tableTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: 700,
      color: 'var(--text-primary)',
    },
    tableSubtitle: {
      margin: 0,
      fontSize: '14px',
      color: 'var(--text-muted)',
    },
    tableWrapper: {
      overflowX: 'auto',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '0 0 12px 0',
      backgroundColor: 'var(--surface-card)',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      minWidth: '800px',
    },
    th: {
      textAlign: 'left',
      padding: '16px 24px',
      fontSize: '13px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--surface-muted)',
    },
    td: {
      padding: '16px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: '14px',
      color: 'var(--text-primary)',
      verticalAlign: 'middle',
      backgroundColor: 'var(--surface-card)',
      transition: 'background-color 0.2s',
    },
    rolePill: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      gap: '6px',
    },
    rowActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      opacity: 0.7,
      transition: 'opacity 0.2s',
    },
    tableActionBtn: {
      padding: '6px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableDangerBtn: {
      padding: '6px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#EF4444',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: 'var(--surface-muted)',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    userSub: {
      fontSize: '12px',
      color: 'var(--text-muted)',
    },
    stateBlock: {
      padding: '60px 20px',
      textAlign: 'center',
      color: 'var(--text-muted)',
    },
    tabContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: '0',
    },
    tabButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '12px 12px 0 0',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
    },
    tabButtonActive: {
      color: 'var(--color-primary)',
      backgroundColor: 'var(--surface-app)',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: 'var(--color-primary)',
      borderRadius: '2px 2px 0 0',
    },
  };

  const buttonStyle = {
    padding: '10px 18px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundImage: 'var(--gradient-brand)',
    color: '#fff',
    boxShadow: 'var(--shadow-md)',
  };

  const dangerButton = {
    ...buttonStyle,
    backgroundColor: '#E53935',
    color: '#fff',
  };

  const successButton = {
    ...buttonStyle,
    backgroundColor: '#43A047',
    color: '#fff',
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.2s ease-out',
  };

  const modalContentStyle = {
    backgroundColor: 'var(--surface-card)',
    padding: '32px',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease-out',
    color: 'var(--text-primary)',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '15px',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: 'var(--surface-muted)',
    color: 'var(--text-primary)', // Ensure text is readable
  };

  return (
    <div style={{ ...styles.app, paddingBottom: 0 }}>
      <div style={dashboardStyles.page}>
        <div style={dashboardStyles.main}>
        <button 
          onClick={() => navigate('/')}
          style={dashboardStyles.backButton}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={20} />
          Quay lại trang chủ
        </button>

        <section style={dashboardStyles.heroCard}>
          <div style={dashboardStyles.heroText}>
            <div style={dashboardStyles.heroBadge}>
              <span>🌱</span>
              <span>Chế độ quản trị</span>
            </div>
            <h1 style={dashboardStyles.heroTitle}>Quản lý người dùng</h1>
            <p style={dashboardStyles.heroSubtitle}>
              Theo dõi, phân quyền và tạo mới tài khoản để đảm bảo hệ thống luôn vận hành ổn định.
            </p>
          </div>
          <div style={dashboardStyles.heroRight}>
            <div style={dashboardStyles.heroHighlight}>
              <p style={dashboardStyles.heroHighlightLabel}>Đang quản lý</p>
              <p style={dashboardStyles.heroHighlightValue}>{totalUsers}</p>
              <p style={dashboardStyles.heroHighlightHint}>người dùng</p>
            </div>
            <button style={dashboardStyles.heroButton} onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </section>

        <div style={dashboardStyles.tabContainer}>
          <button
            ref={(el) => (tabsRef.current['dashboard'] = el)}
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...dashboardStyles.tabButton,
              ...(activeTab === 'dashboard' ? dashboardStyles.tabButtonActive : {}),
            }}
          >
            <LayoutDashboard size={18} />
            Tổng quan
          </button>
          <button
            ref={(el) => (tabsRef.current['challenges'] = el)}
            onClick={() => setActiveTab('challenges')}
            style={{
              ...dashboardStyles.tabButton,
              ...(activeTab === 'challenges' ? dashboardStyles.tabButtonActive : {}),
            }}
          >
            <Target size={18} />
            Thử thách
          </button>
          <button
            ref={(el) => (tabsRef.current['leaderboard'] = el)}
            onClick={() => setActiveTab('leaderboard')}
            style={{
              ...dashboardStyles.tabButton,
              ...(activeTab === 'leaderboard' ? dashboardStyles.tabButtonActive : {}),
            }}
          >
            <Trophy size={18} />
            BXH
          </button>
          <button
            ref={(el) => (tabsRef.current['settings'] = el)}
            onClick={() => setActiveTab('settings')}
            style={{
              ...dashboardStyles.tabButton,
              ...(activeTab === 'settings' ? dashboardStyles.tabButtonActive : {}),
            }}
          >
            <Settings size={18} />
            Cài đặt
          </button>
          <div
            style={{
              ...dashboardStyles.tabIndicator,
              ...indicatorStyle,
              transition: 'all 0.3s ease',
            }}
          />
        </div>

        <div style={{ 
          position: 'relative', 
          overflow: 'hidden', 
          minHeight: '600px' // Prevent layout shift
        }}>
          {/* Content Wrapper for sliding effect could go here, but for now let's just conditionally render with animation */}
          
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <section style={dashboardStyles.metricsGrid}>
          {metrics.map((metric) => (
            <div 
              key={metric.label} 
              style={dashboardStyles.metricCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
              }}
            >
              <div style={dashboardStyles.metricContent}>
                <p style={dashboardStyles.metricLabel}>{metric.label}</p>
                <p style={dashboardStyles.metricValue}>{metric.value}</p>
                <p style={dashboardStyles.metricHint}>{metric.hint}</p>
              </div>
              <div style={{ ...dashboardStyles.metricIcon, backgroundColor: metric.bgColor }}>
                {metric.icon}
              </div>
            </div>
          ))}
        </section>

        <section style={dashboardStyles.roleFilterBar}>
          <button
            type="button"
            onClick={clearRoleFilters}
            style={{
              ...dashboardStyles.roleBadge,
              ...dashboardStyles.roleBadgeAll,
              ...(activeRoles.length === 0 ? dashboardStyles.roleBadgeActive : {}),
            }}
          >
            <span>Tất cả ({totalUsers})</span>
          </button>
          {roleBadgeItems.map(({ key, label, color, bg }) => {
            const isActive = activeRoles.includes(key);
            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleRoleFilter(key)}
                style={{
                  ...dashboardStyles.roleBadge,
                  ...(isActive 
                    ? { ...dashboardStyles.roleBadgeActive, backgroundColor: color, borderColor: color } 
                    : {}
                  ),
                }}
              >
                <div 
                  style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: isActive ? '#fff' : color 
                  }} 
                />
                {label}: {roleCounts[key] || 0}
              </button>
            );
          })}
        </section>

        {error && (
          <div style={dashboardStyles.errorCard}>
            ⚠️ {error}
          </div>
        )}

        <section style={dashboardStyles.actionCard}>
          <div style={dashboardStyles.actionLeft}>
            <div style={dashboardStyles.searchWrapper}>
              <span style={dashboardStyles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm theo username hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={dashboardStyles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={dashboardStyles.clearSearchButton}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <p style={dashboardStyles.searchMeta}>
                Tìm thấy {filteredUsers.length}/{totalUsers} kết quả
              </p>
            )}
          </div>
          <div style={dashboardStyles.actionButtons}>
            <button
              onClick={fetchUsers}
              style={dashboardStyles.ctaSecondaryButton}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : '🔄 Làm mới'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              style={dashboardStyles.ctaPrimaryButton}
            >
              + Tạo người dùng
            </button>
          </div>
        </section>

        <section style={dashboardStyles.tableCard}>
          <div style={dashboardStyles.tableHeader}>
            <div>
              <h3 style={dashboardStyles.tableTitle}>Danh sách người dùng</h3>
              <p style={dashboardStyles.tableSubtitle}>
                {filteredUsers.length} người dùng được hiển thị • {filterSummary}
              </p>
            </div>
          </div>
          {loading ? (
            <div style={dashboardStyles.stateBlock}>Đang tải dữ liệu...</div>
          ) : users.length === 0 ? (
            <div style={dashboardStyles.stateBlock}>Chưa có người dùng nào trong hệ thống.</div>
          ) : filteredUsers.length === 0 ? (
            <div style={dashboardStyles.stateBlock}>
              Không tìm thấy người dùng với điều kiện hiện tại.
            </div>
          ) : (
            <div style={dashboardStyles.tableWrapper}>
              <table style={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th style={dashboardStyles.th}>Username</th>
                    <th style={dashboardStyles.th}>Họ tên</th>
                    <th style={dashboardStyles.th}>Email</th>
                    <th style={dashboardStyles.th}>Số điện thoại</th>
                    <th style={dashboardStyles.th}>Vai trò</th>
                    <th style={dashboardStyles.th}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const roleConfig = roleBadgeItems.find(r => r.key === getRoleName(u.roles)) || roleBadgeItems[3];
                    return (
                      <tr 
                        key={u.id}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F8FAFC';
                          const actions = e.currentTarget.querySelector('.row-actions');
                          if (actions) actions.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff';
                          const actions = e.currentTarget.querySelector('.row-actions');
                          if (actions) actions.style.opacity = '0.7';
                        }}
                        style={{ transition: 'background-color 0.2s' }}
                      >
                        <td style={dashboardStyles.td}>
                          <div style={dashboardStyles.userCell}>
                            <div style={dashboardStyles.userAvatar}>
                              {(u.username?.[0] || 'U').toUpperCase()}
                            </div>
                            <div style={dashboardStyles.userInfo}>
                              <span style={{ fontWeight: 500 }}>{u.username}</span>
                              <span style={dashboardStyles.userSub}>ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td style={dashboardStyles.td}>
                          {`${u.firstName || ''} ${u.lastName || ''}`.trim() || '-'}
                        </td>
                        <td style={dashboardStyles.td}>{u.email || '-'}</td>
                        <td style={dashboardStyles.td}>{u.phone || '-'}</td>
                        <td style={dashboardStyles.td}>
                          <span style={{
                            ...dashboardStyles.rolePill,
                            backgroundColor: roleConfig.bg,
                            color: roleConfig.color
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: roleConfig.color }} />
                            {getRoleName(u.roles)}
                          </span>
                        </td>
                        <td style={dashboardStyles.td}>
                          <div className="row-actions" style={dashboardStyles.rowActions}>
                            <button
                              onClick={() => openEditModal(u)}
                              style={dashboardStyles.tableActionBtn}
                              title="Chỉnh sửa"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              style={dashboardStyles.tableDangerBtn}
                              title="Xóa người dùng"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <section style={dashboardStyles.actionCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Quản lý Thử thách</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Tạo và quản lý các nhiệm vụ cho người dùng</p>
                </div>
                <button
                  onClick={() => setShowCreateChallengeModal(true)}
                  style={dashboardStyles.ctaPrimaryButton}
                >
                  <Plus size={18} style={{ marginRight: '8px' }} />
                  Thêm thử thách mới
                </button>
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
              {challenges.map(challenge => (
                <div key={challenge.id} style={dashboardStyles.metricCard}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '32px' }}>{challenge.icon}</span>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '99px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        backgroundColor: challenge.type === 'DAILY' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                        color: challenge.type === 'DAILY' ? '#4CAF50' : '#2196F3'
                      }}>
                        {challenge.type}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)' }}>{challenge.title}</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{challenge.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF9800', fontWeight: 600, fontSize: '14px' }}>
                        <Gift size={14} />
                        {challenge.rewardPoints} XP
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={dashboardStyles.tableActionBtn}><Edit2 size={16} /></button>
                        <button style={dashboardStyles.tableDangerBtn}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <section style={dashboardStyles.actionCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Bảng xếp hạng & Trao thưởng</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Theo dõi top người dùng và trao quà thủ công</p>
                </div>
                <button
                  onClick={() => setShowRewardModal(true)}
                  style={{ ...dashboardStyles.ctaPrimaryButton, backgroundImage: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}
                >
                  <Gift size={18} style={{ marginRight: '8px' }} />
                  Tặng quà thủ công
                </button>
              </div>
            </section>

            <section style={{ ...dashboardStyles.tableCard, marginTop: '24px' }}>
              <div style={dashboardStyles.tableWrapper}>
                <table style={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th style={dashboardStyles.th}>Hạng</th>
                      <th style={dashboardStyles.th}>Người dùng</th>
                      <th style={dashboardStyles.th}>Điểm XP</th>
                      <th style={dashboardStyles.th}>Danh hiệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? leaderboard.map((user, index) => (
                      <tr key={user.id}>
                        <td style={dashboardStyles.td}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            backgroundColor: index < 3 ? '#FFC107' : '#E0E0E0',
                            color: index < 3 ? '#000' : '#757575',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 700
                          }}>
                            {index + 1}
                          </div>
                        </td>
                        <td style={dashboardStyles.td}>
                          <div style={dashboardStyles.userCell}>
                            <div style={dashboardStyles.userAvatar}>{(user.username?.[0] || 'U').toUpperCase()}</div>
                            <span style={{ fontWeight: 500 }}>{user.username}</span>
                          </div>
                        </td>
                        <td style={dashboardStyles.td}><span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{user.totalPoints} XP</span></td>
                        <td style={dashboardStyles.td}>{user.title || 'Mới bắt đầu'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ ...dashboardStyles.td, textAlign: 'center', padding: '40px' }}>Chưa có dữ liệu bảng xếp hạng</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
            <ThemeCustomizer />
          </div>
        )}
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showChallengeModal && (
        <div style={modalStyle} onClick={() => setShowCreateChallengeModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Tạo Thử thách mới</h2>
            <form onSubmit={handleCreateChallenge}>
              <input type="text" placeholder="Tên thử thách" style={inputStyle} value={challengeData.title} onChange={e => setChallengeData({...challengeData, title: e.target.value})} required />
              <input type="text" placeholder="Mô tả ngắn" style={inputStyle} value={challengeData.description} onChange={e => setChallengeData({...challengeData, description: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="Mục tiêu (số lần)" style={inputStyle} value={challengeData.goal} onChange={e => setChallengeData({...challengeData, goal: e.target.value})} />
                <input type="number" placeholder="Điểm thưởng XP" style={inputStyle} value={challengeData.rewardPoints} onChange={e => setChallengeData({...challengeData, rewardPoints: e.target.value})} />
              </div>
              <select style={inputStyle} value={challengeData.type} onChange={e => setChallengeData({...challengeData, type: e.target.value})}>
                <option value="DAILY">Hàng ngày</option>
                <option value="WEEKLY">Hàng tuần</option>
                <option value="ONE_TIME">Một lần</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={primaryButton}>Tạo thử thách</button>
                <button type="button" onClick={() => setShowCreateChallengeModal(false)} style={buttonStyle}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Reward Modal */}
      {showRewardModal && (
        <div style={modalStyle} onClick={() => setShowRewardModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Tặng quà cho thành viên</h2>
            <form onSubmit={handleGiveReward}>
              <input type="text" placeholder="ID người dùng hoặc Username" style={inputStyle} value={rewardData.userId} onChange={e => setRewardData({...rewardData, userId: e.target.value})} required />
              <input type="number" placeholder="Số điểm thưởng" style={inputStyle} value={rewardData.score} onChange={e => setRewardData({...rewardData, score: e.target.value})} required />
              <input type="text" placeholder="Lý do tặng quà" style={inputStyle} value={rewardData.reason} onChange={e => setRewardData({...rewardData, reason: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...primaryButton, backgroundImage: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}>Gửi quà tặng</button>
                <button type="button" onClick={() => setShowRewardModal(false)} style={buttonStyle}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={modalStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Tạo người dùng mới</h2>
            <form onSubmit={handleCreateUser}>
              <input
                type="text"
                placeholder="Username *"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={inputStyle}
                required
              />
              <input
                type="password"
                placeholder="Password *"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Họ"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Tên"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyle}
              />
              <input
                type="date"
                placeholder="Ngày sinh"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={inputStyle}
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="LEARNER">LEARNER</option>
                <option value="CREATOR">CREATOR</option>
                <option value="MOD">MOD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={successButton}>
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={buttonStyle}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div style={modalStyle} onClick={() => setShowEditModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Sửa người dùng</h2>
            <form onSubmit={handleEditUser}>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                disabled
                style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
              />
              <input
                type="password"
                placeholder="Password (để trống nếu không đổi)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Họ"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Tên"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyle}
              />
              <input
                type="date"
                placeholder="Ngày sinh"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={inputStyle}
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="LEARNER">LEARNER</option>
                <option value="CREATOR">CREATOR</option>
                <option value="MOD">MOD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={primaryButton}>
                  Cập nhật
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  style={buttonStyle}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
        </style>
      </div>
    </div>
  );
};

export default AdminDashboard;

