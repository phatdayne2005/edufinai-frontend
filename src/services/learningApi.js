import { authApi } from './authApi';

const BASE_URL = 'http://localhost:8080/learning';

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
  const response = await fetch(`${BASE_URL}/creators/me/lessons`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch lessons');
  return response.json();
};

export const getCreatorStats = async () => {
  const response = await fetch(`${BASE_URL}/creators/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch creator stats');
  return response.json();
};

export const createLesson = async (lessonData) => {
  const response = await fetch(`${BASE_URL}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(lessonData),
  });
  if (!response.ok) throw new Error('Failed to create lesson');
  return response.json();
};

// Moderator APIs
export const getPendingLessons = async () => {
  const response = await fetch(`${BASE_URL}/moderators/lessons?status=PENDING`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch pending lessons');
  return response.json();
};

export const moderateLesson = async (lessonId, status, comment) => {
  const response = await fetch(`${BASE_URL}/moderators/lessons/${lessonId}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, commentByMod: comment }),
  });
  if (!response.ok) throw new Error('Failed to moderate lesson');
  return response.json();
};

