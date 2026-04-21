import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash } from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";

export default function AccountView() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const { userName, updateUserName } = useUser();
  const [userEmail, setUserEmail] = useState("");
  const [updatedName, setUpdatedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const avatarUrl = `https://robohash.org/${userName}?set=set5&size=148x148`;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await API.post(
        "/api/user/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(res.data.message);
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = async () => {
    setLoading(true);
    try {
      const res = await API.patch(
        "/api/user/change-name",
        { fullName: updatedName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      updateUserName(res.data.fullName);

      setShowNameModal(false);
      toast.success("Name updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setLoading(true);
    try {
      const res = await API.patch(
        "/api/user/change-email",
        {
          password: currentPassword,
          newEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.setItem("email", res.data.newEmail);
      setUserEmail(res.data.newEmail);
      toast.success("Email updated successfully");

      setShowEmailModal(false);
      setCurrentPassword("");
      setNewEmail("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const res = await API.delete("/api/user/delete-account", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: { password: deletePassword },
      });

      localStorage.clear();
      navigate("/");

      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold p-6 font-Chakra">Account Management</h1>
      <div className="flex flex-col items-center justify-center bg-[#21232f] text-white p-6">
        <div className="bg-[#3D415A] p-10 rounded-2xl shadow-lg w-3xl">
          <div className="flex flex-col items-center">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-37 h-37 rounded-full border-2 border-blue-500 mb-4"
            />
            <div className="w-full">
              <div className="items-center mb-3 grid grid-cols-3">
                <span className="text-white">Full Name</span>
                <span className="flex items-center">{userName}</span>
                <Pencil
                  className="w-4 h-4 ml-2 text-blue-400 hover:text-blue-300 cursor-pointer"
                  onClick={() => {
                    setUpdatedName(userName);
                    setShowNameModal(true);
                  }}
                />
              </div>
              <div className="items-center mb-3 grid grid-cols-3">
                <span className="text-white">Email</span>
                <span className="flex items-center overflow-auto">
                  {userEmail}
                </span>
                <span
                  className="text-blue-400 hover:text-blue-300 cursor-pointer ml-2"
                  onClick={() => setShowEmailModal(true)}
                >
                  Change email
                </span>
              </div>
              <div className="items-center mb-3 grid grid-cols-3">
                <span className="text-white">Password</span>
                <span></span>
                <span
                  className="text-blue-400 hover:text-blue-300 cursor-pointer ml-2"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change password
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              className="flex items-center text-red-500 hover:text-red-400 transition cursor-pointer"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash className="w-5 h-5 mr-2" /> Delete Account
            </button>
          </div>
        </div>

        {showNameModal && (
          <div className="fixed inset-0 bg-[#00000093] flex justify-center items-center z-50">
            <div className="bg-[#3D415A] p-6 rounded-2xl w-[300px] shadow-lg border border-gray-700">
              <h2 className="text-white text-lg font-semibold mb-4 text-center font-Chakra">
                Change Full Name
              </h2>
              <input
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
                className="w-full mb-4 p-2 rounded bg-gray-800 text-white focus:outline-none"
                placeholder="Enter your full name"
              />
              <div className="flex justify-between">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="p-0.5 font-open-sans bg-gradient-to-b from-[#94FFF2] to-[#506DFF] rounded-lg hover:from-[#506DFF] hover:to-[#94fff2]"
                >
                  <div className="bg-[#21232F] px-4 py-1 rounded-[calc(8px-2px)]">
                    Cancel
                  </div>
                </button>
                <button
                  onClick={handleChangeName}
                  className="px-4 py-1 min-w-[90px] bg-gradient-to-b from-[#94FFF2] to-[#506DFF] hover:opacity-90 rounded-lg cursor-pointer flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Change"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-[#00000093] bg-opacity-50">
            <div className="bg-[#3D415A] p-6 rounded-lg shadow-lg text-white max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4 font-Chakra text-center">
                Confirm Deletion
              </h2>

              <label className="block font-open-sans mb-2">
                Enter Your Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full mb-4 p-2 rounded bg-gray-800 text-white focus:outline-none"
                placeholder="Confirm password"
              />
              <span
                onClick={() => setShowPasswords((prev) => !prev)}
                className="text-sm text-blue-300 cursor-pointer text-right hover:underline"
              >
                {showPasswords ? "Hide Password 🔒" : "Show Password 🔓"}
              </span>
              <p className="text-sm text-red-400">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                    setShowPasswords(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 min-w-[90px] bg-red-600 rounded hover:bg-red-500 cursor-pointer flex items-center justify-center"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#3D415A] p-6 rounded-2xl w-[300px] shadow-lg border border-gray-700">
              <h2 className="text-white text-lg font-semibold mb-4 text-center font-Chakra">
                Change Password
              </h2>
              <form onSubmit={handleChangePassword}>
                <label className="block font-open-sans mb-2">
                  Enter Current Password
                </label>
                <input
                  name="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  className="w-full mb-3 p-2 rounded bg-gray-800 text-white focus:outline-none"
                />

                <label className="block font-open-sans mb-2">
                  Enter New Password
                </label>
                <input
                  name="newPassword"
                  type={showPasswords ? "text" : "password"}
                  className="w-full mb-3 p-2 rounded bg-gray-800 text-white focus:outline-none"
                />

                <label className="block font-open-sans mb-2">
                  Re-Enter New Password
                </label>
                <input
                  name="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  className="w-full mb-2 p-2 rounded bg-gray-800 text-white focus:outline-none"
                />

                <span
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="text-sm text-blue-300 cursor-pointer text-right hover:underline"
                >
                  {showPasswords ? "Hide Passwords 🔒" : "Show Passwords 🔓"}
                </span>

                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setShowPasswords(false);
                    }}
                    className="p-0.5 font-open-sans bg-gradient-to-b from-[#94FFF2] to-[#506DFF] rounded-lg transition hover:from-[#506DFF] hover:to-[#94fff2] flex items-center justify-center"
                  >
                    <div className="bg-[#21232F] px-4 py-1 rounded-[calc(8px-2px)] ">
                      Cancel
                    </div>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 min-w-[90px] bg-gradient-to-b  from-[#94FFF2] to-[#506DFF] cursor-pointer hover:opacity-90 rounded-lg flex justify-center items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Change"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmailModal && (
          <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#3D415A] p-6 rounded-2xl w-[300px] shadow-lg border border-gray-700">
              <h2 className="text-white text-lg font-semibold mb-4 text-center font-Chakra">
                Change Email
              </h2>

              <label className="block font-open-sans mb-2">
                Current Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mb-3 p-2 rounded bg-gray-800 text-white focus:outline-none"
                placeholder="Enter current password"
              />

              <label className="block font-open-sans mb-2">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full mb-2 p-2 rounded bg-gray-800 text-white focus:outline-none"
                placeholder="Enter new email"
              />

              <span
                onClick={() => setShowPasswords((prev) => !prev)}
                className="text-sm text-blue-300 cursor-pointer text-right hover:underline"
              >
                {showPasswords ? "Hide Password 🔒" : "Show Password 🔓"}
              </span>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setCurrentPassword("");
                    setNewEmail("");
                    setShowPasswords(false);
                  }}
                  className="p-0.5 font-open-sans bg-gradient-to-b from-[#94FFF2] to-[#506DFF] rounded-lg hover:from-[#506DFF] hover:to-[#94fff2]"
                >
                  <div className="bg-[#21232F] px-4 py-1 rounded-[calc(8px-2px)]">
                    Cancel
                  </div>
                </button>
                <button
                  onClick={handleChangeEmail}
                  className="px-4 py-1 min-w-[90px] bg-gradient-to-b from-[#94FFF2] to-[#506DFF] hover:opacity-90 rounded-lg cursor-pointer flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Change"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
