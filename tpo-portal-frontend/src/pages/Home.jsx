import { Link } from "react-router-dom";

const Home = () => {
  const roles = [
    {
      name: "Student",
      login: "/student/login",
      register: "/student/register",
      colorClass: "blue",
    },
    {
      name: "CRC",
      login: "/crc/login",
      register: "/crc/register",
      colorClass: "green",
    },
    {
      name: "Admin",
      login: "/admin/login",
      register: "/admin/register",
      colorClass: "purple",
    },
  ];

  const colorMap = {
    blue: {
      border: "border-blue-600",
      text: "text-blue-700",
      bg: "bg-blue-600",
      bgHover: "hover:bg-blue-700",
      borderHover: "hover:bg-blue-50",
    },
    green: {
      border: "border-green-600",
      text: "text-green-700",
      bg: "bg-green-600",
      bgHover: "hover:bg-green-700",
      borderHover: "hover:bg-green-50",
    },
    purple: {
      border: "border-purple-600",
      text: "text-purple-700",
      bg: "bg-purple-600",
      bgHover: "hover:bg-purple-700",
      borderHover: "hover:bg-purple-50",
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700">
          🎓 College Training & Placement Portal
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Login or register according to your role
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl">
        {roles.map((role) => {
          const color = colorMap[role.colorClass];
          return (
            <div
              key={role.name}
              className={`bg-white shadow-lg rounded-2xl border-t-4 ${color.border} flex flex-col items-center p-6 hover:shadow-xl transition`}
            >
              <h2 className={`text-2xl font-bold ${color.text} mb-4`}>
                {role.name}
              </h2>
              <div className="space-x-4">
                <Link
                  to={role.login}
                  className={`${color.bg} text-white px-4 py-2 rounded-lg ${color.bgHover} transition`}
                >
                  Login
                </Link>
                <Link
                  to={role.register}
                  className={`border ${color.border} ${color.text} px-4 py-2 rounded-lg ${color.borderHover} transition`}
                >
                  Register
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()} Training & Placement Cell | Your College
      </footer>
    </div>
  );
};

export default Home;
