import { useHealthStore } from "../../stores/healthStore";

export default function HealthDashboardCard() {
  const { currentEmotion, confidence, moodBucket, lastUpdated, lastBreakReminderAt } = useHealthStore();

  return (
    <div className="bg-[#3D415A] rounded-lg p-4 mb-6 border border-[#e4e6f3ab]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Health Dashboard</h2>
        <span className={`text-xs px-2 py-1 rounded ${moodBucket === "stressed" ? "bg-red-900 text-red-200" : "bg-[#21232f] text-gray-200"}`}>
          {moodBucket === "stressed" ? "Stress Watch" : "Stable"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
        <div className="bg-[#21232f] rounded p-3">
          <p className="text-gray-400">Current Emotion</p>
          <p className="font-semibold capitalize">{currentEmotion}</p>
        </div>
        <div className="bg-[#21232f] rounded p-3">
          <p className="text-gray-400">Confidence</p>
          <p className="font-semibold">{(confidence * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-[#21232f] rounded p-3">
          <p className="text-gray-400">Last Break Reminder</p>
          <p className="font-semibold">{lastBreakReminderAt ? new Date(lastBreakReminderAt).toLocaleTimeString() : "Not triggered"}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Last update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "No samples yet"}
      </p>
    </div>
  );
}
