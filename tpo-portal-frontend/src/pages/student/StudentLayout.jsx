import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const StudentLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
