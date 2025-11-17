import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminApi from '../../services/authApi';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
    },
    {
      label: 'Tài khoản Admin',
      value: roleCounts.ADMIN || 0,
      hint: 'Quản trị viên có toàn quyền',
    },
    {
      label: 'Người học',
      value: roleCounts.LEARNER || 0,
      hint: 'Vai trò LEARNER trong hệ thống',
    },
    {
      label: 'Hồ sơ hoàn chỉnh',
      value: `${completionPercent}%`,
      hint: `${completedProfiles} hồ sơ đã điền đủ thông tin`,
    },
  ];

  const roleBadgeItems = [
    { key: 'ADMIN', label: 'Admin' },
    { key: 'MOD', label: 'Mod' },
    { key: 'CREATOR', label: 'Creator' },
    { key: 'LEARNER', label: 'Learner' },
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
      backgroundColor: '#F4F7FB',
      padding: '32px 16px 48px',
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    heroCard: {
      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
      borderRadius: '28px',
      padding: '32px',
      color: '#fff',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      boxShadow: '0 25px 60px rgba(76, 175, 80, 0.35)',
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
      backgroundColor: '#fff',
      color: '#2E7D32',
      padding: '12px 28px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
    },
    metricCard: {
      backgroundColor: '#fff',
      borderRadius: '20px',
      padding: '20px',
      border: '1px solid #E4EBE5',
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
    },
    metricLabel: {
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#90A4AE',
      margin: 0,
    },
    metricValue: {
      fontSize: '28px',
      fontWeight: 700,
      margin: '10px 0 6px 0',
      color: '#263238',
    },
    metricHint: {
      margin: 0,
      fontSize: '13px',
      color: '#607D8B',
    },
    roleFilterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
    },
    roleBadge: {
      backgroundColor: '#fff',
      border: '1px solid #E8EFE5',
      borderRadius: '999px',
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#1B5E20',
      boxShadow: '0 6px 14px rgba(27, 94, 32, 0.08)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    roleBadgeActive: {
      backgroundColor: '#2E7D32',
      color: '#fff',
      borderColor: 'transparent',
      boxShadow: '0 8px 18px rgba(46, 125, 50, 0.3)',
    },
    roleBadgeAll: {
      backgroundColor: '#fff',
      border: '1px solid #CFD8DC',
      color: '#546E7A',
    },
    errorCard: {
      backgroundColor: '#FFEBEE',
      borderRadius: '18px',
      padding: '16px 20px',
      color: '#C62828',
      border: '1px solid #FFCDD2',
    },
    actionCard: {
      backgroundColor: '#fff',
      borderRadius: '22px',
      padding: '20px',
      border: '1px solid #E4EBE5',
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
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
      color: '#90A4AE',
      fontSize: '16px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      borderRadius: '14px',
      border: '1px solid #E0E7EC',
      backgroundColor: '#F7FAFC',
      fontSize: '14px',
      outline: 'none',
      transition: 'border 0.2s',
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
      color: '#90A4AE',
      padding: '4px',
    },
    searchMeta: {
      margin: '8px 0 0 0',
      fontSize: '13px',
      color: '#607D8B',
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
      border: '1px solid #CFD8DC',
      backgroundColor: '#fff',
      color: '#37474F',
      fontWeight: 600,
      cursor: 'pointer',
    },
    ctaPrimaryButton: {
      padding: '12px 22px',
      borderRadius: '14px',
      border: 'none',
      backgroundColor: '#2E7D32',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(46, 125, 50, 0.3)',
    },
    tableCard: {
      backgroundColor: '#fff',
      borderRadius: '26px',
      padding: '24px',
      border: '1px solid #E4EBE5',
      boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
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
      color: '#263238',
    },
    tableSubtitle: {
      margin: 0,
      fontSize: '14px',
      color: '#78909C',
    },
    tableWrapper: {
      overflowX: 'auto',
      border: '1px solid #DDE5E0',
      borderRadius: '20px',
      padding: '0 0 12px 0',
      backgroundColor: '#fff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '720px',
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#90A4AE',
      borderBottom: '1px solid #E3EBE7',
    },
    td: {
      padding: '14px 16px',
      borderBottom: '1px solid #EEF2F0',
      fontSize: '14px',
      color: '#37474F',
      verticalAlign: 'middle',
    },
    rolePill: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '999px',
      backgroundColor: '#E8F5E9',
      color: '#2E7D32',
      fontSize: '12px',
      fontWeight: 600,
    },
    rowActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    tableActionBtn: {
      padding: '8px 14px',
      borderRadius: '10px',
      border: '1px solid rgba(46,125,50,0.2)',
      backgroundColor: 'rgba(76,175,80,0.08)',
      color: '#2E7D32',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    tableDangerBtn: {
      padding: '8px 14px',
      borderRadius: '10px',
      border: '1px solid rgba(239,83,80,0.3)',
      backgroundColor: 'rgba(239,83,80,0.12)',
      color: '#C62828',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    stateBlock: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#78909C',
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
    backgroundColor: '#2E7D32',
    color: '#fff',
    boxShadow: '0 8px 18px rgba(46, 125, 50, 0.25)',
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
    backgroundColor: 'rgba(13, 24, 33, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 60px rgba(15, 23, 42, 0.15)',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '15px',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#F9FBFC',
  };

  return (
    <div style={dashboardStyles.page}>
      <div style={dashboardStyles.main}>
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

        <section style={dashboardStyles.metricsGrid}>
          {metrics.map((metric) => (
            <div key={metric.label} style={dashboardStyles.metricCard}>
              <p style={dashboardStyles.metricLabel}>{metric.label}</p>
              <p style={dashboardStyles.metricValue}>{metric.value}</p>
              <p style={dashboardStyles.metricHint}>{metric.hint}</p>
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
            Tất cả ({totalUsers})
          </button>
          {roleBadgeItems.map(({ key, label }) => {
            const isActive = activeRoles.includes(key);
            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleRoleFilter(key)}
                style={{
                  ...dashboardStyles.roleBadge,
                  ...(isActive ? dashboardStyles.roleBadgeActive : {}),
                }}
              >
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
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={dashboardStyles.td}>{u.username}</td>
                      <td style={dashboardStyles.td}>
                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || '-'}
                      </td>
                      <td style={dashboardStyles.td}>{u.email || '-'}</td>
                      <td style={dashboardStyles.td}>{u.phone || '-'}</td>
                      <td style={dashboardStyles.td}>
                        <span style={dashboardStyles.rolePill}>{getRoleName(u.roles)}</span>
                      </td>
                      <td style={dashboardStyles.td}>
                        <div style={dashboardStyles.rowActions}>
                          <button
                            onClick={() => openEditModal(u)}
                            style={dashboardStyles.tableActionBtn}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={dashboardStyles.tableDangerBtn}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

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
                style={{ ...inputStyle, backgroundColor: '#f5f5f5' }}
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
    </div>
  );
};

export default AdminDashboard;

