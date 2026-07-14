const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to make API requests with HTTP-only credentials
const apiRequest = async (url, options = {}) => {
    const defaultHeaders = {
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        credentials: "include" // Mandatory to pass cookies between client/server
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
};

export const registerUser = async (fullName, email, password) => {
    return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password })
    });
};

export const loginUser = async (email, password) => {
    return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
};

export const logoutUser = async () => {
    return apiRequest("/api/auth/logout", {
        method: "POST"
    });
};

export const getMe = async () => {
    return apiRequest("/api/auth/me");
};
