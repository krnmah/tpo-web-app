import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImageCarousel from "../components/Carousel";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        <ImageCarousel />
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Welcome to NIT Srinagar Training & Placement Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A unified platform for students, CRC, and admin to manage placement activities efficiently.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
