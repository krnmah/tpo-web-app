import { useEffect, useState } from "react";

// Company data with local logo paths (served from public folder)
const COMPANIES = [
  { name: "Google", logo: "/google_new2.webp" },
  { name: "Microsoft", logo: "/microsoft.webp" },
  { name: "Amazon", logo: "/amazon.jpg" },
  { name: "Infosys", logo: "/infosys.png" },
  { name: "TCS", logo: "/tcs.jpg" },
  { name: "HSBC", logo: "/hsbc.jpg" },
  { name: "Optum", logo: "/optum.png" },
  { name: "Oracle", logo: "/oracle.png" },
  { name: "Fanatics", logo: "/fanatics.png" },
  { name: "Global Logic", logo: "/globallogic.png" },
];

const TopRecruiters = () => {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Duplicate array for seamless infinite loop
  const displayCompanies = [...COMPANIES, ...COMPANIES];

  return (
    <section
      className="py-16 bg-white overflow-hidden"
      aria-label="Top Recruiters"
    >
      {/* Section Header */}
      <div className="text-center mb-10 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Top Recruiters
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Leading companies hiring from our campus
        </p>
      </div>

      {/* Scrolling Container */}
      <div
        className="relative"
        onMouseEnter={() => !reducedMotion && setPaused(true)}
        onMouseLeave={() => !reducedMotion && setPaused(false)}
      >
        {/* Fade masks for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Animated Track */}
        <div
          className={`flex items-center ${
            reducedMotion ? "" : "animate-scroll"
          } ${paused ? "[animation-play-state:paused]" : ""}`}
          style={
            reducedMotion
              ? {}
              : {
                  animationDuration: "40s",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                }
          }
        >
          {displayCompanies.map((company, index) => (
            <div
              key={`${company.name}-${index}`}
              className="flex flex-col items-center justify-center flex-shrink-0 px-8 sm:px-12 md:px-16"
              style={{ width: "160px" }}
            >
              {/* Logo Container */}
              <div className="group relative flex flex-col items-center">
                {/* Logo */}
                {company.hasBg ? (
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      loading="lazy"
                      className="h-10 sm:h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 ease-out group-hover:scale-110"
                      style={{
                        maxHeight: "48px",
                        maxWidth: "120px",
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    loading="lazy"
                    className="h-10 sm:h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 ease-out group-hover:scale-110"
                    style={{
                      maxHeight: "48px",
                      maxWidth: "120px",
                    }}
                  />
                )}

                {/* Company Name */}
                <span className="mt-3 text-xs sm:text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors duration-200 text-center">
                  {company.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation-name: scroll;
        }
      `}</style>
    </section>
  );
};

export default TopRecruiters;
