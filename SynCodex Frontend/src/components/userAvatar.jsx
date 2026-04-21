import { useUser } from "../context/UserContext";

const UserAvatar = () => {
  const { userName } = useUser();
  const avatarUrl = `https://robohash.org/${userName}?set=set5&size=50x50`;

  return (
    <div className="flex items-center justify-center space-x-2 p-2 mt-10">
      <img src={avatarUrl} alt={userName} className="w-10 h-10 rounded-full" />
      <span className="text-white font-semibold ">
        {userName || "Guest"}
      </span>
    </div>
  );
};
export default UserAvatar;
