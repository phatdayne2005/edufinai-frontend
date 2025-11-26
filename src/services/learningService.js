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
    // ============================================
    // 1. LEARNER APIs
    // ============================================

    /**
     * Get current learner profile with level and EXP percentage
     * Response includes: id, level, totalExp, expPercent
     */
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

    /**
     * Get learners filtered by level
     * @param level - BEGINNER | INTERMEDIATE | ADVANCED
     */
    getLearnersByLevel: async (token, level) => {
        const response = await fetch(`${API_BASE_URL}/learners/level/${level}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // ============================================
    // 2. CREATOR APIs
    // ============================================

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

    /**
     * Get lessons created by current creator
     */
    getMyLessons: async (token) => {
        const response = await fetch(`${API_BASE_URL}/creators/me/lessons`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // ============================================
    // 3. LESSON APIs
    // ============================================

    /**
     * Get all lessons (public endpoint, auth optional)
     */
    getAllLessons: async (token) => {
        const response = await fetch(`${API_BASE_URL}/lessons`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    getLessonById: async (token, id) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${id}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Get lesson by slug (e.g., "introduction-to-budgeting")
     */
    getLessonBySlug: async (token, slug) => {
        const response = await fetch(`${API_BASE_URL}/lessons/slug/${slug}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Filter lessons by tag
     * @param tag - BUDGETING | INVESTING | SAVING | DEBT | TAX
     */
    filterLessonsByTag: async (token, tag) => {
        const response = await fetch(`${API_BASE_URL}/lessons/tags/${tag}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Filter lessons by difficulty
     * @param difficulty - BASIC | INTERMEDIATE | ADVANCED
     */
    filterLessonsByDifficulty: async (token, difficulty) => {
        const response = await fetch(`${API_BASE_URL}/lessons/difficulty/${difficulty}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Filter lessons by status
     * @param status - DRAFT | PENDING | APPROVED | REJECTED
     */
    filterLessonsByStatus: async (token, status) => {
        const response = await fetch(`${API_BASE_URL}/lessons/status/${status}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Create new lesson (Creator only)
     * @param lessonData - { title, description, content, durationMinutes, difficulty, tags, quizJson, ... }
     */
    createLesson: async (token, lessonData) => {
        const response = await fetch(`${API_BASE_URL}/lessons`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(lessonData),
        });
        return handleResponse(response);
    },

    /**
     * Update lesson by ID (Creator only)
     */
    updateLesson: async (token, lessonId, lessonData) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(lessonData),
        });
        return handleResponse(response);
    },

    /**
     * Submit lesson for review (Creator only)
     * Changes status from DRAFT to PENDING
     */
    submitLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/submit`, {
            method: 'PUT',
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Delete lesson (Creator only)
     */
    deleteLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    // ============================================
    // 4. ENROLLMENT APIs
    // ============================================

    /**
     * Enroll in a lesson (Learner only)
     * Validates level requirements:
     * - BEGINNER can only enroll in BASIC
     * - INTERMEDIATE can enroll in BASIC and INTERMEDIATE
     * - ADVANCED can enroll in all
     * 
     * @param lessonId - UUID of the lesson
     * @returns Enrollment object with earnedExp: 0
     * @throws Error if level insufficient
     */
    enrollInLesson: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ lessonId }),
        });
        return handleResponse(response);
    },

    /**
     * Get all enrollments for current learner
     * Response includes: earnedExp, correctAnswers fields
     */
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

    /**
     * Update enrollment progress and earn EXP
     * NEW in v2.0: Only earns EXP when improving best score
     * 
     * @param progressData - {
     *   status: "IN_PROGRESS" | "COMPLETED",
     *   progressPercent: 100,
     *   score: 100,
     *   addAttempt: 1,
     *   correctAnswers: 5  // REQUIRED - number of correct answers
     * }
     * @returns GamificationRes with EXP earned info
     */
    updateEnrollmentProgress: async (token, enrollmentId, progressData) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/progress`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(progressData),
        });
        return handleResponse(response);
    },

    /**
     * Get enrollment for a specific lesson by slug
     * Useful for checking if user is enrolled and their progress
     * 
     * @param slug - Lesson slug
     * @returns Enrollment object or throws 404 if not enrolled
     */
    getMyEnrollmentForLesson: async (token, slug) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${slug}/my-enrollment`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Update enrollment progress by lesson slug
     * Same as updateEnrollmentProgress but uses slug instead of enrollmentId
     * 
     * @param slug - Lesson slug
     * @param progressData - Same as updateEnrollmentProgress
     * @returns GamificationRes
     */
    updateMyEnrollmentProgressBySlug: async (token, slug, progressData) => {
        const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${slug}/my-enrollment/progress`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(progressData),
        });
        return handleResponse(response);
    },

    // ============================================
    // 5. MODERATOR APIs
    // ============================================

    getAllModerators: async (token) => {
        const response = await fetch(`${API_BASE_URL}/moderators`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Get lessons for moderation filtering by status
     * @param status - PENDING | APPROVED | REJECTED (default: PENDING)
     */
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

    /**
     * Get lesson detail for moderation
     */
    getLessonDetailForMod: async (token, lessonId) => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons/${lessonId}`, {
            headers: getHeaders(token),
        });
        return handleResponse(response);
    },

    /**
     * Approve or reject a lesson
     * @param decisionData - {
     *   status: "APPROVED" | "REJECTED",
     *   commentByMod: "Feedback message (max 2000 chars)"
     * }
     */
    moderateLesson: async (token, lessonId, decisionData) => {
        const response = await fetch(`${API_BASE_URL}/moderators/lessons/${lessonId}/decision`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(decisionData),
        });
        return handleResponse(response);
    },

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Helper function to check if learner can enroll based on level
     * @param learnerLevel - BEGINNER | INTERMEDIATE | ADVANCED
     * @param lessonDifficulty - BASIC | INTERMEDIATE | ADVANCED
     * @returns boolean
     */
    canEnroll: (learnerLevel, lessonDifficulty) => {
        const levelMap = {
            'BEGINNER': ['BASIC'],
            'INTERMEDIATE': ['BASIC', 'INTERMEDIATE'],
            'ADVANCED': ['BASIC', 'INTERMEDIATE', 'ADVANCED']
        };
        return levelMap[learnerLevel]?.includes(lessonDifficulty) || false;
    },

    /**
     * Get required level for a lesson difficulty
     * @param difficulty - BASIC | INTERMEDIATE | ADVANCED
     * @returns Required learner level
     */
    getRequiredLevel: (difficulty) => {
        const requirementMap = {
            'BASIC': 'BEGINNER',
            'INTERMEDIATE': 'INTERMEDIATE',
            'ADVANCED': 'ADVANCED'
        };
        return requirementMap[difficulty] || 'BEGINNER';
    },

    /**
     * Get next level name
     * @param currentLevel - BEGINNER | INTERMEDIATE | ADVANCED
     * @returns Next level or null if already at max
     */
    getNextLevel: (currentLevel) => {
        const levelProgression = {
            'BEGINNER': 'INTERMEDIATE',
            'INTERMEDIATE': 'ADVANCED',
            'ADVANCED': null
        };
        return levelProgression[currentLevel];
    }
};
