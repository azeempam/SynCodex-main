import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) setUserName(name);
  }, []);

  const updateUserName = (name) => {
    localStorage.setItem("name", name);
    setUserName(name);
  };

  return (
    <UserContext.Provider value={{ userName, updateUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
