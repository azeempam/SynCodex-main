import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function CreateProjectModal({ onClose }) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    const projectData = {
      token: localStorage.getItem("token"),
      email: localStorage.getItem("email"),
      name: projectName,
      description: projectDescription,
    };

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/projects/create-project",
        projectData
      );

      console.log("Project Data :: ", res.data);

      if (res.status === 201) {
        toast.success("Project created successfully!");
        const { projectId } = res.data;
        window.open(`/editor/${projectId}`, "_blank");
      }
    } catch (error) {
      console.error("Project Creation Failed :", error);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#3D415A] p-6 rounded-2xl shadow-4xl w-94 text-white">
        <div className="flex items-center gap-6 justify-end">
          <h2 className="text-2xl font-Chakra font-bold mb-4 ml-10">
            Create New Project
          </h2>
          <button className="p-2 rounded mb-4 cursor-pointer" onClick={onClose}>
            <X size={25} />
          </button>
        </div>
        <label className="block font-open-sans mb-2">Enter Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter Project Name"
          className="w-full p-2 mb-3 rounded-lg bg-[#21232f] text-white outline-none"
        />

        <label className="block font-open-sans mb-2">Project Description</label>
        <textarea
          type="text"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="w-full p-2 mb-2 bg-[#21232f] text-white  outline-none rounded-lg"
          placeholder="(optional)"
        ></textarea>

        <p className="text-sm text-gray-400 mb-4">
          Note: It takes a few seconds to create a new project.
        </p>

        <button
          onClick={handleCreate}
          className="p-2 bg-gradient-to-b from-[#94FFF2] to-[#506DFF] cursor-pointer hover:opacity-90 w-full flex rounded-lg items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 my-0.5 border-white border-t-transparent rounded-full animate-spin items-center justify-center"></div>
          ) : (
            "Create Project"
          )}
        </button>
      </div>
    </div>
  );
}
