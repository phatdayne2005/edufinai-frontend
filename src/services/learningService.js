const API_BASE_URL = 'http://localhost:8080/learning';

const getHeaders = (token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
});

const handleResponse = async (response) => {
    if (!response.ok) {
        const text = await response.text();
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || 'API request failed');
        } catch (e) {
            throw new Error(text || `API request failed with status ${response.status}`);
        }
    }
    if (response.status === 204) return null;
    return response.json();
};

export const learningService = {
    // Learner APIs
    getLearnerProfile: async (token) => {
        const response = await fetch(`${API_BASE_URL}/learners/me`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getLearnerById: async (token, id) => {
        const response = await fetch(`${API_BASE_URL}/learners/${id}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getAllLearners: async (token) => {
        const response = await fetch(`${API_BASE_URL}/learners`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getLearnersByLevel: async (token, level) => {
        const response = await fetch(`${API_BASE_URL}/learners/level/${level}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // Creator APIs
    getCreatorProfile: async (token) => {
        const response = await fetch(`${API_BASE_URL}/creators/me`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getCreatorById: async (token, id) => {
        const response = await fetch(`${API_BASE_URL}/creators/${id}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getAllCreators: async (token) => {
        const response = await fetch(`${API_BASE_URL}/creators`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getMyLessons: async (token) => {
        const response = await fetch(`${API_BASE_URL}/creators/me/lessons`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // Lesson APIs
    getAllLessons: async (token) => {
        const response = await fetch(`${API_BASE_URL}/lessons`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getLessonById: async (token, id) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
            headers: getHeaders(token), // Auth is optional but good to pass if available
        });
        return handleResponse(response);
    },

    getLessonBySlug: async (token, slug) => {
        const response = await fetch(`${API_BASE_URL}/lessons/slug/${slug}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    filterLessonsByTag: async (token, tag) => {
        const response = await fetch(`${API_BASE_URL}/lessons/tags/${tag}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    filterLessonsByDifficulty: async (token, difficulty) => {
        const response = await fetch(`${API_BASE_URL}/lessons/difficulty/${difficulty}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    filterLessonsByStatus: async (token, status) => {
        const response = await fetch(`${API_BASE_URL}/lessons/status/${status}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    createLesson: async (token, lessonData) => {
        const response = await fetch(`${API_BASE_URL}/lessons`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(lessonData),
        });
        return handleResponse(response);
    },

    updateLesson: async (token, lessonId, lessonData) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(lessonData),
        });
        return handleResponse(response);
    },

    submitLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/submit`, {
            method: 'PUT',
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    deleteLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // Enrollment APIs
    enrollInLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ lessonId }),
        });
        return handleResponse(response);
    },

    getMyEnrollments: async (token) => {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getEnrollmentDetail: async (token, enrollmentId) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    updateEnrollmentProgress: async (token, enrollmentId, progressData) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/progress`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(progressData),
        });
        return handleResponse(response);
    },

    // New slug-based enrollment APIs
    getMyEnrollmentForLesson: async (token, slug) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${slug}/my-enrollment`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    updateMyEnrollmentProgressBySlug: async (token, slug, progressData) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${slug}/my-enrollment/progress`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(progressData),
        });
        return handleResponse(response);
    },

    // Moderator APIs
    getAllModerators: async (token) => {
        const response = await fetch(`${API_BASE_URL}/moderators`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getModerationLessons: async (token, status = 'PENDING') => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons?status=${status}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getPendingLessons: async (token) => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons?status=PENDING`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getLessonDetailForMod: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons/${lessonId}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    moderateLesson: async (token, lessonId, decisionData) => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons/${lessonId}/decision`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(decisionData),
        });
        return handleResponse(response);
    },
};
