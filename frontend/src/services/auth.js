const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Helper to make API requests with HTTP-only credentials or Authorization header fallback
const apiRequest = async (url, options = {}) => {
    const defaultHeaders = {
        "Content-Type": "application/json"
    };

    // Attach Bearer token from localStorage if present to bypass third-party cookie blocks
    const token = localStorage.getItem("token");
    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

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
    const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password })
    });
    if (data?.token) {
        localStorage.setItem("token", data.token);
    }
    return data;
};

export const loginUser = async (email, password) => {
    const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    if (data?.token) {
        localStorage.setItem("token", data.token);
    }
    return data;
};

export const logoutUser = async () => {
    localStorage.removeItem("token");
    return apiRequest("/api/auth/logout", {
        method: "POST"
    });
};

export const getMe = async () => {
    return apiRequest("/api/auth/me");
};
