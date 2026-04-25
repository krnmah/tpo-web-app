import nitsImage from "../assets/nits.jpg";
import TopRecruiters from "../components/TopRecruiters";
import SharedHeader from "../components/SharedHeader";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Shared Header */}
      <SharedHeader />

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
              Department
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm" style={{ color: '#475569' }}>
          <span>© 2026 Training & Placement Department</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <a
            href="/TnP-Policy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
          >
            T&P Policies
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
