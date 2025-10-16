// src/components/Carousel.jsx
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ImageCarousel = () => {
  const slides = [
    { id: 1, img: "/images/img1.jpg", caption: "100+ Companies Visiting" },
    { id: 2, img: "/images/img2.jpg", caption: "Top Packages Offered" },
    { id: 3, img: "/images/img3.jpg", caption: "NIT Srinagar - Shaping Careers" },
  ];

  return (
    <Carousel
      autoPlay
      infiniteLoop
      showStatus={false}
      showThumbs={false}
      interval={3500}
    >
      {slides.map((slide) => (
        <div key={slide.id}>
          <img src={slide.img} alt={slide.caption} className="h-[600px] w-full object-cover" />
          <p className="legend text-lg">{slide.caption}</p>
        </div>
      ))}
    </Carousel>
  );
};

export default ImageCarousel;
