import { authApi } from './authApi';

const BASE_URL = 'http://localhost:8080/learning';
const USE_MOCK_DATA = true; // Set to true to force mock data

// --- Mock Data Store ---
let mockLessons = [
  { 
    id: '1', 
    title: 'Nhập môn Tài chính Cá nhân', 
    description: 'Làm quen với các khái niệm cơ bản về tiền tệ, thu nhập và chi tiêu.', 
    status: 'APPROVED', 
    difficulty: 'BEGINNER',
    timeEstimate: 30,
    createdAt: '2023-11-01T08:00:00Z', 
    updatedAt: '2023-11-02T09:00:00Z',
    creator: { id: 'c1', username: 'creator_demo' },
    content: [
        { id: 'b1', type: 'text', data: 'Chào mừng bạn đến với khóa học Tài chính cá nhân. Trong bài này, chúng ta sẽ tìm hiểu về...' },
        { id: 'b2', type: 'video', data: 'https://www.youtube.com/watch?v=demo1' }
    ]
  },
  { 
    id: '2', 
    title: 'Đầu tư Chứng khoán cho người mới', 
    description: 'Hướng dẫn đọc bảng điện và phân tích cơ bản.', 
    status: 'PENDING', 
    difficulty: 'INTERMEDIATE',
    timeEstimate: 45,
    createdAt: '2023-11-10T10:30:00Z', 
    updatedAt: '2023-11-10T10:30:00Z',
    creator: { id: 'c1', username: 'creator_demo' } 
  },
  { 
    id: '3', 
    title: 'Quy tắc 50/30/20', 
    description: 'Phương pháp quản lý ngân sách hiệu quả.', 
    status: 'DRAFT', 
    difficulty: 'BEGINNER',
    timeEstimate: 15,
    createdAt: '2023-11-15T14:00:00Z', 
    updatedAt: '2023-11-15T14:00:00Z',
    creator: { id: 'c1', username: 'creator_demo' } 
  },
  { 
    id: '4', 
    title: 'Blockchain và Crypto', 
    description: 'Hiểu về công nghệ chuỗi khối.', 
    status: 'REJECTED', 
    difficulty: 'ADVANCED',
    timeEstimate: 60,
    createdAt: '2023-11-12T09:00:00Z', 
    updatedAt: '2023-11-13T11:00:00Z',
    commentByMod: 'Nội dung chưa phù hợp, cần bổ sung cảnh báo rủi ro.',
    creator: { id: 'c1', username: 'creator_demo' } 
  },
  { 
    id: '5', 
    title: 'Lập kế hoạch nghỉ hưu', 
    description: 'Chuẩn bị tài chính cho tuổi già.', 
    status: 'PENDING', 
    difficulty: 'INTERMEDIATE',
    timeEstimate: 40,
    createdAt: '2023-11-18T16:20:00Z', 
    updatedAt: '2023-11-18T16:20:00Z',
    creator: { id: 'c2', username: 'other_creator' } 
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Creator APIs
export const getMyLessons = async () => {
  if (USE_MOCK_DATA) {
    await delay(600);
    // Filter lessons for 'creator_demo' (id: c1)
    return mockLessons.filter(l => l.creator.id === 'c1');
  }

  const response = await fetch(`${BASE_URL}/creators/me/lessons`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch lessons');
  return response.json();
};

export const getCreatorStats = async () => {
  if (USE_MOCK_DATA) {
    await delay(400);
    const myLessons = mockLessons.filter(l => l.creator.id === 'c1');
    return {
      totalLessons: myLessons.length,
      approvedLessons: myLessons.filter(l => l.status === 'APPROVED').length,
      totalViews: 1250, // Mock views
      avgRating: 4.5    // Mock rating
    };
  }

  const response = await fetch(`${BASE_URL}/creators/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch creator stats');
  return response.json();
};

export const createLesson = async (lessonData) => {
  if (USE_MOCK_DATA) {
    await delay(800);
    const newLesson = {
      id: Math.random().toString(36).substr(2, 9),
      ...lessonData,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: { id: 'c1', username: 'creator_demo' }
    };
    mockLessons.unshift(newLesson);
    return newLesson;
  }

  const response = await fetch(`${BASE_URL}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(lessonData),
  });
  if (!response.ok) throw new Error('Failed to create lesson');
  return response.json();
};

export const deleteLesson = async (lessonId) => {
  if (USE_MOCK_DATA) {
    await delay(500);
    mockLessons = mockLessons.filter(l => l.id !== lessonId);
    return true;
  }

  const response = await fetch(`${BASE_URL}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete lesson');
  return true;
};

export const updateLesson = async (lessonId, updateData) => {
  if (USE_MOCK_DATA) {
    await delay(600);
    const index = mockLessons.findIndex(l => l.id === lessonId);
    if (index !== -1) {
      mockLessons[index] = { 
        ...mockLessons[index], 
        ...updateData, 
        updatedAt: new Date().toISOString(),
        status: 'DRAFT' // Reset to DRAFT on update
      };
      return mockLessons[index];
    }
    throw new Error('Lesson not found');
  }

  const response = await fetch(`${BASE_URL}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error('Failed to update lesson');
  return response.json();
};

export const submitLesson = async (lessonId) => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const index = mockLessons.findIndex(l => l.id === lessonId);
    if (index !== -1) {
      mockLessons[index].status = 'PENDING';
      mockLessons[index].updatedAt = new Date().toISOString();
      return mockLessons[index];
    }
    throw new Error('Lesson not found');
  }

  const response = await fetch(`${BASE_URL}/lessons/${lessonId}/submit`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to submit lesson');
  return response.json();
};

// Moderator APIs
export const getPendingLessons = async () => {
  if (USE_MOCK_DATA) {
    await delay(600);
    // Return all lessons with PENDING status from all creators
    return mockLessons.filter(l => l.status === 'PENDING');
  }

  const response = await fetch(`${BASE_URL}/moderators/lessons?status=PENDING`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch pending lessons');
  return response.json();
};

export const moderateLesson = async (lessonId, status, comment) => {
  if (USE_MOCK_DATA) {
    await delay(700);
    const index = mockLessons.findIndex(l => l.id === lessonId);
    if (index !== -1) {
      mockLessons[index].status = status;
      mockLessons[index].commentByMod = comment;
      mockLessons[index].updatedAt = new Date().toISOString();
      return mockLessons[index];
    }
    throw new Error('Lesson not found');
  }

  const response = await fetch(`${BASE_URL}/moderators/lessons/${lessonId}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, commentByMod: comment }),
  });
  if (!response.ok) throw new Error('Failed to moderate lesson');
  return response.json();
};
