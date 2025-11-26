# Custom Notification System

## 🎯 Overview
Hệ thống thông báo custom đẹp mắt thay thế `alert()` và `confirm()` mặc định của browser.

## 📦 Components

### 1. Toast Notifications
Thông báo nhỏ ở góc phải màn hình với 4 loại:
- ✅ **Success** (màu xanh lá)
- ❌ **Error** (màu đỏ)
- ⚠️ **Warning** (màu cam)
- ℹ️ **Info** (màu xanh dương)

### 2. Confirmation Dialogs
Dialog xác nhận giữa màn hình với backdrop blur

## 🔨 Usage

### Import Hook
```javascript
import { useNotification } from '../../context/NotificationContext';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();
  
  // ... your code
};
```

### Show Toast Notifications

**Success:**
```javascript
showSuccess('Đã lưu thành công!');
```

**Error:**
```javascript
showError('Không thể lưu dữ liệu: ' + error.message);
```

**Warning:**
```javascript
showWarning('Bạn chưa điền đủ thông tin!');
```

**Info:**
```javascript
showInfo('Dữ liệu đang được xử lý...');
```

### Show Confirmation Dialog

**Basic:**
```javascript
const handleDelete = async () => {
  const confirmed = await showConfirm('Bạn có chắc muốn xóa?');
  if (confirmed) {
    // Do delete
  }
};
```

**Advanced with options:**
```javascript
const confirmed = await showConfirm('Gửi bài học để kiểm duyệt?', {
  title: 'Xác nhận gửi',
  confirmText: 'Gửi ngay',
  cancelText: 'Hủy',
  type: 'info' // 'warning' | 'success' | 'error' | 'info'
});
```

## 🔄 Migration Guide

### Before (Old way)
```javascript
// Alert
alert('Đã lưu thành công!');

// Confirm
if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
  // do something
}
```

### After (New way)
```javascript
// Alert → showSuccess/showError/showWarning/showInfo
showSuccess('Đã lưu thành công!');

// Confirm → showConfirm
const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa?');
if (confirmed) {
  // do something
}
```

## ✨ Features

- ✅ Auto-dismiss sau 4 giây
- ✅ Progress bar hiển thị thời gian còn lại
- ✅ Smooth animations (fade in, scale, slide)
- ✅ Click outside để đóng dialog
- ✅ Nút X để đóng toast
- ✅ Backdrop blur cho dialog
- ✅ Responsive design
- ✅ Dark mode support

## 🎨 Customization

Nếu cần custom, edit các file:
- `src/components/notifications/Toast.jsx`
- `src/components/notifications/ConfirmDialog.jsx`
- `src/context/NotificationContext.jsx`
