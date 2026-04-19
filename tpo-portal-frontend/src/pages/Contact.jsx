import { Link } from "react-router-dom";
import nitsLogo from "../assets/nitslogo.png";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and College Name - Top Left */}
            <a
              href="https://nitsri.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80 focus:outline-none rounded-lg focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
            >
              <img
                src={nitsLogo}
                alt="NIT Srinagar Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold tracking-tight" style={{ color: '#020617' }}>
                  National Institute of Technology
                </h1>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  Srinagar
                </p>
              </div>
            </a>

            {/* Navigation Links - Center (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/home"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#475569' }}
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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#020617' }}
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
          </div>
        </div>
      </nav>

      {/* Contact Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          
          <div className="max-w-2xl mx-auto">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Address</h3>
                    <p className="text-slate-600">Department of Training and Placement, National Institute of Technology Srinagar, Jammu & Kashmir, India – 190006</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Email</h3>
                    <a href="mailto:placements@nitsri.ac.in" className="text-sky-600 hover:text-sky-700 transition-colors duration-200 cursor-pointer">
                      placements@nitsri.ac.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Phone</h3>
                    <div className="flex flex-col gap-1">
                      <a href="tel:+919419226538" className="text-sky-600 hover:text-sky-700 transition-colors duration-200 cursor-pointer">
                        +91 94192 26538
                      </a>
                      <a href="tel:+919419226574" className="text-sky-600 hover:text-sky-700 transition-colors duration-200 cursor-pointer">
                        +91 94192 26574
                      </a>
                      <a href="tel:+919419991553" className="text-sky-600 hover:text-sky-700 transition-colors duration-200 cursor-pointer">
                        +91 94199 91553
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t bg-white/50 backdrop-blur-sm" style={{ borderColor: '#E2E8F0' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#475569' }}>
            © {new Date().getFullYear()} Training & Placement Cell, NIT Srinagar
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
