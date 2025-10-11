import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const StudentLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="bg-white shadow p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Student Dashboard
          </h1>
        </header>

        {/* 👇 Here your nested student pages will render */}
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
