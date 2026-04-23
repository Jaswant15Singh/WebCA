(function () {
  const FRONTEND_BASE = "./";
  const LOGIN_PAGE = `${FRONTEND_BASE}/index.html`;
  const SIGNUP_PAGE = `${FRONTEND_BASE}/signup.html`;
  const DASHBOARD_PAGE = `${FRONTEND_BASE}/dashboard.html`;
  const FLASH_KEY = "clientHubFlash";

  const keys = {
    token: "clientHubToken",
    adminId: "clientHubAdminId",
    username: "clientHubUsername",
  };

  const getToken = () => localStorage.getItem(keys.token) || "";
  const getAdminId = () => localStorage.getItem(keys.adminId) || "";
  const getUsername = () => localStorage.getItem(keys.username) || "";
  const isLoggedIn = () => Boolean(getToken());

  const saveSession = ({ token = "", adminId = "", username = "" }) => {
    localStorage.setItem(keys.token, token);
    localStorage.setItem(keys.adminId, adminId);
    localStorage.setItem(keys.username, username);
  };

  const clearSession = () => {
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.adminId);
    localStorage.removeItem(keys.username);
  };

  const setFlash = (message, type = "success") => {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
  };

  const showMessage = (message, type = "success") => {
    const box = document.querySelector("[data-message]");
    if (!box) {
      return;
    }

    box.textContent = message;
    box.className = `message ${type}`;
    box.style.display = "block";
  };

  const clearMessage = () => {
    const box = document.querySelector("[data-message]");
    if (!box) {
      return;
    }

    box.textContent = "";
    box.className = "message";
    box.style.display = "none";
  };

  const showFlashIfAny = () => {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) {
      return;
    }

    sessionStorage.removeItem(FLASH_KEY);

    try {
      const flash = JSON.parse(raw);
      showMessage(flash.message, flash.type);
    } catch (_error) {
      // ignore invalid flash data
    }
  };

  const updateAuthText = () => {
    document.querySelectorAll("[data-auth-text]").forEach((item) => {
      item.textContent = isLoggedIn()
        ? `Logged in as admin: ${getUsername()}`
        : "Not logged in";
    });
  };

  const goToLogin = (message) => {
    if (message) {
      setFlash(message, "error");
    }
    window.location.href = LOGIN_PAGE;
  };

  const requireAuthPage = () => {
    if (!isLoggedIn()) {
      goToLogin("Please login first to continue.");
      return false;
    }

    return true;
  };

  const redirectLoggedInUser = () => {
    if (isLoggedIn()) {
      window.location.href = DASHBOARD_PAGE;
    }
  };

  const apiRequest = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (getToken()) {
      headers.set("Authorization", `Bearer ${getToken()}`);
    }

    const response = await fetch(`http://webca-1.onrender.com${url}`, {
      ...options,
      headers,
    });

    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        goToLogin("Session expired. Please login again.");
        throw new Error("Session expired");
      }

      throw new Error(data?.error || data?.message || "Request failed");
    }

    return data;
  };

  const createFormData = (form) => {
    const formData = new FormData();
    const entries = new FormData(form);

    for (const [key, value] of entries.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          formData.append(key, value);
        }
        continue;
      }

      if (String(value).trim() !== "") {
        formData.append(key, value);
      }
    }

    return formData;
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not set";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value, currency = "EUR") => {
    const amount = Number(value || 0);

    try {
      return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency,
      }).format(amount);
    } catch (_error) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const bindLogoutButtons = () => {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        clearSession();
        setFlash("You are logged out.", "success");
        window.location.href = `./index.html`;
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    updateAuthText();
    bindLogoutButtons();
    showFlashIfAny();
  });

  window.ClientHub = {
    FRONTEND_BASE,
    LOGIN_PAGE,
    SIGNUP_PAGE,
    DASHBOARD_PAGE,
    getToken,
    getAdminId,
    getUsername,
    isLoggedIn,
    saveSession,
    clearSession,
    setFlash,
    showMessage,
    clearMessage,
    updateAuthText,
    redirectLoggedInUser,
    requireAuthPage,
    apiRequest,
    createFormData,
    formatDate,
    formatCurrency,
  };
})();
