
const API_BASE_URL = "http://127.0.0.1:8000/api";

function saveTokens(data) {
  sessionStorage.setItem("accessToken", data.access);
  sessionStorage.setItem("refreshToken", data.refresh);
}

export function clearTokens() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
}

let refreshInFlight = null;

function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) return Promise.resolve(false);

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const tokens = await response.json().catch(() => null);
      if (!response.ok || !tokens?.access) return false;

      sessionStorage.setItem("accessToken", tokens.access);
      if (tokens.refresh) sessionStorage.setItem("refreshToken", tokens.refresh);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function request(endpoint, options = {}, retry = true) {

  const accessToken = sessionStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Refresh expired access token once.
  if (response.status === 401 && retry &&
      !endpoint.startsWith("/auth/")) {

    if (await refreshSession()) {
      return request(endpoint, options, false);
    }

    clearTokens();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data ? JSON.stringify(data) : `API request failed (HTTP ${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}


export const api = {

  async login(username, password) {

    const data = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }, false);

    saveTokens(data);

    return data;
  },

  getCurrentUser: () => request("/auth/me/"),

  async logout() {
    try {
      if (!sessionStorage.getItem("refreshToken")) return;

      const sendLogout = () => request("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({
          refresh: sessionStorage.getItem("refreshToken"),
        }),
      }, false);

      try {
        await sendLogout();
      } catch (error) {
        if (error.status !== 401 || !(await refreshSession())) throw error;
        await sendLogout();
      }
    } finally {
      clearTokens();
    }
  },

  getCandidates: () => request("/candidates/"),

  createCandidate: (data) =>
    request("/candidates/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getJobs: () => request("/jobs/"),

  createJob: (data) =>
    request("/jobs/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getApplications: () => request("/applications/"),

  createApplication: (data) => request("/applications/", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  updateApplication: (id, data) => request(`/applications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

  getInterviews: () => request("/interviews/"),

  createInterview: (data) => request("/interviews/", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  updateInterview: (id, data) => request(`/interviews/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

  getOffers: () => request("/offers/"),

  createOffer: (data) => request("/offers/", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  updateOffer: (id, data) => request(`/offers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

  deleteCandidate: (id) =>
    request(`/candidates/${id}/`, {
      method: "DELETE",
    }),

  deleteJob: (id) =>
    request(`/jobs/${id}/`, {
      method: "DELETE",
    }),
};
