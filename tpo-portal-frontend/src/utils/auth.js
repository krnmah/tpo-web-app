// Save token
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Get token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Remove token (logout)
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Check login status
export const isLoggedIn = () => {
  return !!getToken();
};
