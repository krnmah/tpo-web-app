import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-700">Student Dashboard</h1>
      <div className="flex items-center gap-3">
        <span className="text-gray-600">{user.name}</span>
        <img
          src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
      </div>
    </header>
  );
};

export default Navbar;
