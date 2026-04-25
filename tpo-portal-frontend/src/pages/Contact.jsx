import SharedHeader from "../components/SharedHeader";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Shared Header */}
      <SharedHeader />

      {/* Contact Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">

          <div className="max-w-2xl mx-auto">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Email</h3>
                    <a href="mailto:placements@nitsri.ac.in" className="text-sky-600 hover:text-sky-700 transition-colors">
                      placements@nitsri.ac.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Phone</h3>
                    <div className="flex flex-col gap-1">
                      <a href="tel:+919419226538" className="text-sky-600 hover:text-sky-700 transition-colors">
                        +91 94192 26538
                      </a>
                      <a href="tel:+919419226574" className="text-sky-600 hover:text-sky-700 transition-colors">
                        +91 94192 26574
                      </a>
                      <a href="tel:+919419991553" className="text-sky-600 hover:text-sky-700 transition-colors">
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
            © {new Date().getFullYear()} Training & Placement Department, NIT Srinagar
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
