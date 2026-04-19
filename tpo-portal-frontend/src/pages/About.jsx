import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import nitsLogo from "../assets/nitslogo.png";

// Animated Counter Component - handles decimal values for LPA
const AnimatedCounter = ({ end, duration = 2000, suffix = "", isDecimal = false }) => {
  const [count, setCount] = useState(0);
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

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * end);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {isDecimal ? count.toFixed(1) : Math.floor(count)}
      {suffix}
    </span>
  );
};

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

// Stat Card Component
const StatCard = ({ icon, value, suffix, label, color, highlight = false }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
      highlight ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400' : 'bg-white border-slate-100'
    }`}
  >
    {!highlight && (
      <>
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
        <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
      </>
    )}
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
      highlight ? 'bg-white/20 backdrop-blur-sm' : `bg-gradient-to-br ${color}`
    }`}>
      {icon}
    </div>
    <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-white' : 'text-slate-900'}`}>
      <AnimatedCounter end={value} suffix={suffix} isDecimal={!Number.isInteger(value)} />
    </div>
    <div className={`text-sm ${highlight ? 'text-amber-100' : 'text-slate-600'}`}>{label}</div>
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, delay }) => (
  <FadeIn delay={delay}>
    <div className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors duration-200">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  </FadeIn>
);

const About = () => {
  const stats = [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      value: 35.5,
      suffix: " LPA",
      label: "Highest Package 2025",
      color: "from-amber-500 to-orange-600",
      highlight: true
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      value: 8.9,
      suffix: " LPA",
      label: "Average Package 2025",
      color: "from-sky-500 to-blue-600"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      value: 80,
      suffix: "+",
      label: "Companies Visited 2025",
      color: "from-emerald-500 to-green-600"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      value: 76.94,
      suffix: "%",
      label: "Placement Rate 2025",
      color: "from-violet-500 to-purple-600"
    }
  ];

  const additionalStats = [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      value: 787,
      suffix: "",
      label: "Internships Secured 2025",
      color: "from-cyan-500 to-teal-600"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      value: 8.5,
      suffix: " LPA",
      label: "Median Package 2025",
      color: "from-indigo-500 to-blue-600"
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "80+ Top Recruiters",
      description: "Industry leaders like Google, Microsoft, and Deloitte regularly visit our campus for recruitment across CSE, IT, and core engineering branches."
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "State-of-the-Art Infrastructure",
      description: "Dedicated training and placement center with modern facilities for pre-placement talks, online tests, and interview sessions."
    },
    {
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Industry Partnership Focus",
      description: "Strengthening ties for industrial training, internships, and final placements with leading organizations across sectors."
    }
  ];

  const branchStats = [
    { branch: "CSE", avgPackage: "₹11 LPA", color: "from-sky-500 to-blue-600" },
    { branch: "IT", avgPackage: "₹10.4 LPA", color: "from-emerald-500 to-green-600" },
    { branch: "CHE", avgPackage: "₹8.4 LPA", color: "from-violet-500 to-purple-600" },
    { branch: "CIV", avgPackage: "₹8 LPA", color: "from-amber-500 to-orange-600" },
    { branch: "ECE", avgPackage: "₹8.6 LPA", color: "from-rose-500 to-pink-600" },
    { branch: "ELE", avgPackage: "₹8 LPA", color: "from-cyan-500 to-teal-600" },
    { branch: "MECH", avgPackage: "₹8.6 LPA", color: "from-indigo-500 to-blue-600" },
    { branch: "MME", avgPackage: "₹8 LPA", color: "from-fuchsia-500 to-purple-600" }
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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                style={{ color: '#020617' }}
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
          </div>
        </div>
      </nav>

      {/* About Content */}
      <main className="flex-1">
        {/* Hero Section with Animated Background */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-900 to-blue-900 text-white py-20 sm:py-28">
          {/* Animated Background Circles */}
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

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                Training & Placement Cell
              </span>
            </FadeIn>
            <FadeIn delay={150}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-300">Us</span>
              </h1>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/30 mb-6">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                <span className="text-amber-200 text-sm font-medium">2025 Placement Season Data</span>
              </div>
            </FadeIn>
            <FadeIn delay={450}>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Bridging the gap between academic excellence and industry needs, empowering students to achieve their career aspirations with a record-breaking ₹35.5 LPA highest package.
              </p>
            </FadeIn>
          </div>

          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-16 sm:h-24 fill-slate-50"
              preserveAspectRatio="none"
              viewBox="0 0 1440 120"
            >
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Main Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">2025 Placement Highlights</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Official placement statistics for the 2025 academic season
                </p>
              </div>
            </FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <FadeIn key={index} delay={index * 100}>
                  <StatCard {...stat} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Stats Row */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              {additionalStats.map((stat, index) => (
                <FadeIn key={index} delay={index * 100}>
                  <StatCard {...stat} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Branch-wise Stats */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Branch-wise Average Packages</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  2025 placement statistics by department (UG average)
                </p>
              </div>
            </FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {branchStats.map((branch, index) => (
                <FadeIn key={index} delay={index * 100}>
                  <div className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${branch.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.branch}</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                      {branch.avgPackage}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Average Package</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <FadeIn>
                <div className="p-8 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h2>
                  <p className="text-slate-700 leading-relaxed">
                    To empower students with the skills, knowledge, and connections needed to succeed in their chosen careers. Through strategic partnerships with industry leaders like Google, Microsoft, and Deloitte, we bring exceptional placement opportunities to our campus and foster an environment of continuous learning and growth.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={200}>
                <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Vision</h2>
                  <p className="text-slate-700 leading-relaxed">
                    To be the premier institution-industry interface, creating a seamless pathway for students to transition from academia to professional excellence. We envision a future where every NIT Srinagar graduate achieves their full potential in the global marketplace, supported by our state-of-the-art training infrastructure.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">What We Offer</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Comprehensive support systems designed to launch your career on the right trajectory
                </p>
              </div>
            </FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} delay={index * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-sky-900 to-blue-900 text-white">
          <FadeIn>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">Ready to Begin Your Journey?</h2>
              
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-base font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
              >
                Get Started
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t bg-white/50 backdrop-blur-sm" style={{ borderColor: '#E2E8F0' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#475569' }}>
            © {new Date().getFullYear()} Training & Placement Cell, NIT Srinagar
          </p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            Placement data sourced from 2025-26 Placement Brochure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
