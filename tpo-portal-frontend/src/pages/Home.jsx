import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
          🎓 Training & Placement Portal
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          National Institute of Technology, Srinagar
        </p>
      </header>

      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome</h2>
        <p className="text-gray-600 mb-8">
          Please login to access the portal. Your role will be detected automatically.
        </p>

        <Link
          to="/auth"
          className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
        >
          Login / Sign Up
        </Link>

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">Use your @nitsri.ac.in email to login</p>
        </div>
      </div>

      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()} Training & Placement Cell | NIT Srinagar
      </footer>
    </div>
  );
};

export default Home;
