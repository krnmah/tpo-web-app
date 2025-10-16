// src/components/Navbar.jsx
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-700 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">🎓 T&P Portal</h1>
        <div className="space-x-4">
          <Link
            to="/login"
            className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
          >
            Login
          </Link>
          <Link
            to="/student/register"
            className="border border-white px-4 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
