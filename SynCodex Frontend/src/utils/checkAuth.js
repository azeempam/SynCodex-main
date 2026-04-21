import API from "../services/api";

export const checkAuth = async () => {
  try {
    const response = await API.get("/auth/protected", {withCredentials: true});
    return response.data.user;
  } catch (error) {
    return null;
  }
};
