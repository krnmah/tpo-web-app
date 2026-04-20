import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const StudentLayout = () => {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
