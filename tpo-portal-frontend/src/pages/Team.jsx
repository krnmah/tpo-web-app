import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import nitsLogo from "../assets/nitslogo.png";

// Team photos from public folder
const aijazPhoto = "/aijaz.png";
const syedPhoto = "/syed.png";
const umerPhoto = "/umer.png";
const siddharthPhoto = "/siddharth.png";
const karanPhoto = "/karan.png";

// Fade In Component for scroll animations
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        prefersReducedMotion || isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: prefersReducedMotion ? 0 : `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Team Card Component
const TeamCard = ({ member, index }) => (
  <FadeIn delay={index * 150}>
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
      {/* Photo Section - Full photo with white background */}
      <div className="relative h-96 bg-white flex items-center justify-center p-8">
        <img
          src={member.photo}
          alt={member.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info Section */}
      <div className="p-6 text-center bg-white">
        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors duration-200">
          {member.name}
        </h3>
        <p className="text-sm font-semibold text-sky-600 mb-3">{member.role}</p>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a
            href={`mailto:${member.email}`}
            className="hover:text-sky-600 transition-colors duration-200 truncate max-w-[200px]"
            title={member.email}
          >
            {member.email}
          </a>
        </div>
      </div>
    </div>
  </FadeIn>
);

const Team = () => {
  const committeeMembers = [
    {
      name: "Prof. Aijaz Ahmad Mir",
      role: "Head of Department",
      email: "hodtnp@nitsri.ac.in",
      photo: aijazPhoto
    },
    {
      name: "Mr. Syed Hussain Ali",
      role: "Sr. Office Assistant",
      email: "syedhussain@nitsri.ac.in",
      photo: syedPhoto
    },
    {
      name: "Mr. Umer Majid",
      role: "Technical Assistant",
      email: "umer@nitsri.ac.in",
      photo: umerPhoto
    }
  ];

  const developerMembers = [
    {
      name: "Siddharth Varshney",
      email: "siddharthvarshney45@gmail.com",
      photo: siddharthPhoto
    },
    {
      name: "Karan Maheshwari",
      email: "krn.maheshwari9@gmail.com",
      photo: karanPhoto
    }
  ];

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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#020617' }}
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-900 to-blue-900 text-white py-20 sm:py-24">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-20 left-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: '4s' }}
            ></div>
            <div
              className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: '6s', animationDelay: '1s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"
            ></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                Training & Placement Cell
              </span>
            </FadeIn>
            <FadeIn delay={150}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                Placement <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-300">Committee</span>
              </h1>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Meet the dedicated team committed to bridging the gap between academic excellence and industry opportunities.
              </p>
            </FadeIn>
          </div>

          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-16 sm:h-20 fill-slate-50"
              preserveAspectRatio="none"
              viewBox="0 0 1440 100"
            >
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
            </svg>
          </div>
        </section>

        {/* Committee Members Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {committeeMembers.map((member, index) => (
                <TeamCard key={index} member={member} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Developer Team Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Developer Team</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  The talented developers behind this platform.
                </p>
              </div>
            </FadeIn>
            <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {developerMembers.map((member, index) => (
                <TeamCard key={`dev-${index}`} member={member} index={index} />
              ))}
            </div>
          </div>
        </section>
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

export default Team;
