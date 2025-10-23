const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_STORAGE_KEY = "invoice_craftsman_token";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

const setToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      setToken(null);
    }
    const message = typeof data === "string" ? data : data?.message || "Request failed";
    throw new Error(message);
  }

  return data as T;
};

export const authApi = {
  register: async (payload: { email: string; password: string }) => {
    const data = await request<{ token: string; user: { id: string; email: string } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    return data.user;
  },
  login: async (payload: { email: string; password: string }) => {
    const data = await request<{ token: string; user: { id: string; email: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    return data.user;
  },
  me: async () => {
    const user = await request<{ id: string; email: string }>("/auth/me");
    return user;
  },
  logout: () => setToken(null),
  getToken
};

export const clientsApi = {
  list: () => request("/clients"),
  create: (payload: any) =>
    request("/clients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: (id: string, payload: any) =>
    request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  remove: (id: string) =>
    request(`/clients/${id}`, {
      method: "DELETE"
    })
};

export const transactionsApi = {
  list: () => request("/transactions"),
  listAvailable: () => request("/transactions?available=true"),
  create: (payload: any) =>
    request("/transactions", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const invoicesApi = {
  list: () => request("/invoices"),
  create: (payload: any) =>
    request("/invoices", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
