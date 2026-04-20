import { Link } from "react-router-dom";
import nitsImage from "../assets/nits.jpg";
import nitsLogo from "../assets/nitslogo.png";
import TopRecruiters from "../components/TopRecruiters";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and College Name - Top Left */}
            <a
              href="https://nitsri.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80 focus:outline-none"
            >
              <img
                src={nitsLogo}
                alt="NIT Srinagar Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1
                  className="text-base font-semibold tracking-tight"
                  style={{ color: '#020617' }}
                >
                  National Institute of Technology
                </h1>
                <p
                  className="text-xs"
                  style={{ color: '#64748B' }}
                >
                  Srinagar
                </p>
              </div>
            </a>

            {/* Navigation Links - Center (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/home"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#020617' }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#475569' }}
              >
                About
              </Link>
              <Link
                to="/team"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#475569' }}
              >
                Team
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#475569' }}
              >
                Contact
              </Link>
            </div>

            {/* Login Button - Top Right */}
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: '#0369A1' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Login</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded="false"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className="md:hidden hidden pb-4">
            <div className="flex flex-col gap-1">
              <Link
                to="/home"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
              >
                About
              </Link>
              <Link
                to="/team"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
              >
                Team
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div className="relative min-h-[55vh] lg:min-h-[65vh] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${nitsImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-12">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
            Training & Placement
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-sky-200">
              Cell
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Empowering students with career opportunities and industry connections
          </p>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 sm:h-24 fill-white"
            preserveAspectRatio="none"
            viewBox="0 0 1440 120"
          >
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Top Recruiters Section */}
      <TopRecruiters />

      {/* Footer */}
      <footer
        className="relative z-20 mt-auto py-6 px-4 border-t bg-white/50 backdrop-blur-sm text-center"
        style={{ borderColor: '#E2E8F0' }}
      >
        <p className="text-sm" style={{ color: '#475569' }}>
          © 2026 Training & Placement Cell
        </p>
      </footer>
    </div>
  );
};

export default Home;
