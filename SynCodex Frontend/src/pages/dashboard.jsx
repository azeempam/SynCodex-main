import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, ClipboardList, UserRound, Bell } from "lucide-react";
import { toast } from "react-toastify";
import useMeta from "../hooks/useMeta";

import UserAvatar from "../components/userAvatar";
import DashboardView from "../components/dashboard/DashboardView";
import AccountView from "../components/dashboard/AccountView";
import { useUser } from "../context/UserContext";

export default function Dashboard() { 
  useMeta();
  const [activeTab, setActiveTab] = useState("sessions");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [Box, setBox] = useState(false);
  const { userName } = useUser();
  const avatarUrl = `https://robohash.org/${userName}?set=set5&size=50x50`;
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    toast.success("Logged out!");
    navigate("/");
  };

  const CustomButton = ({ children, onClick, className }) => (
    <button
      type="button"
      name="button"
      title="button"
      aria-label="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md transition-all duration-300 ${className}`}
    >
      {children}
    </button>
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleBox = () => setBox(!Box);

  return (
    <div className="flex h-screen bg-[#21232f] text-white">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64 " : "hidden"
        } p-4 bg-[#21232f] flex flex-col justify-between border-r border-[#e4e6f3ab]`}
      >
        <div>
          <h1 className="text-[48px] font-semibold font-Chakra font-gradient">
            SynCodex
          </h1>
          <UserAvatar />
          <nav className="mt-6 space-y-2">
            <CustomButton
              className={`w-full flex items-center justify-center cursor-pointer text-xl ${
                activeTab === "sessions"
                  ? "bg-[#3D415A]"
                  : "bg-[#21232f] hover:bg-[#3D415A]"
              }`}
              onClick={() => setActiveTab("sessions")}
            >
              <ClipboardList size={25} className="mr-2" />
              Activities
            </CustomButton>
            <CustomButton
              className={`w-full flex items-center justify-center cursor-pointer text-xl ${
                activeTab === "account"
                  ? "bg-[#3D415A]"
                  : "bg-[#21232f] hover:bg-[#3D415A]"
              }`}
              onClick={() => setActiveTab("account")}
            >
              <UserRound size={25} className="mr-2" />
              Account
            </CustomButton>
            <CustomButton
              className="w-full flex items-center justify-center text-xl  text-red-400 hover:bg-[#3D415A] cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={25} className="mr-2" /> Logout
            </CustomButton>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="flex items-center py-5 border-b border-[#e4e6f3ab] max-md:justify-between sticky top-0 bg-[#21232f]">
          <CustomButton
            onClick={toggleSidebar}
            className="p-3 ml-2 bg-[#3D415A] text-white cursor-pointer text-lg max-md:hidden"
          >
            ☰
          </CustomButton>
          <h1 className="text-[48px] font-semibold font-Chakra font-gradient ml-2 md:hidden w-[60%]">
            SynCodex
          </h1>
          <div className="w-full flex justify-center items-center max-md:hidden">
            <Search
              className="relative cursor-pointer left-7 text-white"
              size={18}
            />
            <input
              type="text"
              placeholder="Search project or session..."
              className="w-[40%] bg-[#3D415A] placeholder-[#E4E6F3] text-white pl-10 pr-3 py-2 rounded-md focus:outline-none"
            />
          </div>
          <CustomButton className="text-white bg-[#3D415A] mr-2 cursor-pointer">
            <Bell size={25} />
          </CustomButton>
          <img
            src={avatarUrl}
            alt={userName}
            className="w-10 h-10 rounded-full md:hidden mr-3"
            onClick={toggleBox}
          />
          <div
            className={`${
              Box ? "" : "hidden"
            } p-4 bg-[#21232f] flex flex-col shadow-xl rounded-xl justify-between absolute top-25 right-15`}
          >
            <nav className="mt-6 space-y-2">
              <CustomButton
                className={`w-full flex items-center justify-center cursor-pointer text-xl ${
                  activeTab === "sessions"
                    ? "bg-[#3D415A]"
                    : "bg-[#21232f] hover:bg-[#3D415A]"
                }`}
                onClick={() => setActiveTab("sessions")}
              >
                <ClipboardList size={25} className="mr-2" />
                Activities
              </CustomButton>
              <CustomButton
                className={`w-full flex items-center justify-center cursor-pointer text-xl ${
                  activeTab === "account"
                    ? "bg-[#3D415A]"
                    : "bg-[#21232f] hover:bg-[#3D415A]"
                }`}
                onClick={() => setActiveTab("account")}
              >
                <UserRound size={25} className="mr-2" />
                Account
              </CustomButton>
              <CustomButton
                className="w-full flex items-center justify-center text-xl  text-red-400 hover:bg-[#3D415A] cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={25} className="mr-2" /> Logout
              </CustomButton>
            </nav>
          </div>
        </div>

        {/* Content Switcher */}
        {activeTab === "sessions" ? <DashboardView /> : <AccountView />}
      </main>
    </div>
  );
}
