import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function DeleteRoomProjectModal({
  onClose,
  name,
  type,
  roomOrProjectId,
  fetchSessions,
  fetchProjects,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const endpoint =
        type === "project"
          ? "http://localhost:5000/api/projects/delete-project"
          : "http://localhost:5000/api/rooms/delete-room";

      const res = await axios.delete(endpoint, {
        headers: {
          token: localStorage.getItem("token"),
          email: localStorage.getItem("email"),
          itemid: roomOrProjectId,
        },
      });

      if (res.status === 200) {
        toast.success("Deleted: " + name);
        if (type === "project") {
          fetchProjects();
        } else {
          fetchSessions();
        }
      }

      onClose(); // close modal
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#00000093] bg-opacity-50">
      <div className="bg-[#3D415A] p-6 rounded-xl shadow-lg text-white max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4 font-Chakra text-center">
          Confirm Deletion
        </h2>
        <label className="block font-open-sans mb-4">
          {name || "Project or Room"}
        </label>
        <p className="text-sm text-red-400">
          Are you sure you want to delete this Project or Room? This action is
          irreversible and cannot be undone.
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 min-w-[90px] bg-red-600 rounded-lg hover:bg-red-500 cursor-pointer flex items-center justify-center"
            onClick={handleDelete}
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
  );
}