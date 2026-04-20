import { useEffect, useRef } from "react";

// Particle Background Component
// Creates a constellation effect with floating particles connected by lines
// Particles repel from cursor on hover
// Respects prefers-reduced-motion for accessibility
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      drawStaticParticles(ctx, canvas.width, canvas.height);
      return;
    }

    // Configuration
    const config = {
      particleCount: 200,
      connectionDistance: 100,
      mouseRepelDistance: 180,
      particleSpeed: 1.2,
      repelForce: 4,
      particleColor: "rgba(0, 0, 0, 0.8)",  // pure black
      lineColor: "0, 0, 0",  // pure black
    };

    let width = canvas.width;
    let height = canvas.height;

    // Mouse tracking - relative to viewport
    const mouse = { x: null, y: null };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = Math.random() * 30 + 1;
        this.radius = Math.random() * 2 + 1.5;
        this.vx = (Math.random() - 0.5) * config.particleSpeed;
        this.vy = (Math.random() - 0.5) * config.particleSpeed;
      }

      update() {
        // Natural floating movement
        this.x += this.vx;
        this.y += this.vy;

        // Mouse repel effect - stronger and more noticeable
        if (mouse.x !== null && mouse.y !== null) {
          const rect = canvas.getBoundingClientRect();
          const relativeMouseX = mouse.x - rect.left;
          const relativeMouseY = mouse.y - rect.top;

          const dx = relativeMouseX - this.x;
          const dy = relativeMouseY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.mouseRepelDistance) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (config.mouseRepelDistance - distance) / config.mouseRepelDistance;

            // Push away from cursor - much stronger effect
            const directionX = forceDirectionX * force * config.repelForce * this.density;
            const directionY = forceDirectionY * force * config.repelForce * this.density;

            this.x -= directionX;
            this.y -= directionY;

            // Add velocity from repel
            this.vx -= forceDirectionX * force * 0.4;
            this.vy -= forceDirectionY * force * 0.4;
          }
        }

        // Damping to return to normal speed
        const maxSpeed = config.particleSpeed * 2;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        if (this.vy > maxSpeed) this.vy = maxSpeed;
        if (this.vy < -maxSpeed) this.vy = -maxSpeed;

        // Minimal damping - maintain speed
        this.vx *= 0.995;
        this.vy *= 0.995;

        // Ensure minimum movement
        const minSpeed = config.particleSpeed * 0.3;
        if (Math.abs(this.vx) < minSpeed) this.vx = this.vx >= 0 ? minSpeed : -minSpeed;
        if (Math.abs(this.vy) < minSpeed) this.vy = this.vy >= 0 ? minSpeed : -minSpeed;

        // Wrap around edges smoothly
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = config.particleColor;
        ctx.fill();
      }
    }

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      // Calculate particle count based on screen size
      const area = width * height;
      const count = Math.min(config.particleCount, Math.floor(area / 6000));
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    // Draw connections between particles
    const drawConnections = () => {
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.connectionDistance) {
            const opacity = (1 - distance / config.connectionDistance) * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity})`;
            ctx.lineWidth = 1.2;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      drawConnections();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    // Initial setup
    handleResize();
    window.addEventListener("resize", handleResize);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Static version for reduced motion
  const drawStaticParticles = (ctx, width, height) => {
    const config = {
      particleCount: 80,
      connectionDistance: 100,
      particleColor: "rgba(15, 23, 42, 0.6)",
      lineColor: "15, 23, 42"
    };

    const particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
      });
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectionDistance) {
          const opacity = (1 - distance / config.connectionDistance) * 0.2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.particleColor;
      ctx.fill();
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: "#ffffff" }}
      aria-hidden="true"
    />
  );
};

export default ParticleBackground;
