import React, { useEffect, useRef } from 'react';

export const AuroraBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle class
    class Particle {
      constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.1;
      }

      update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce walls
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Keep inside bounds
        this.x = Math.max(0, Math.min(this.x, width));
        this.y = Math.max(0, Math.min(this.y, height));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
    const particles = Array.from({ length: particleCount }, () => new Particle(canvas.width, canvas.height));

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const drawPlexus = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my, radius: mRadius } = mouseRef.current;

      // Draw grid lines (cyber background)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.005)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw();
      });

      // Connect particles & mouse
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Draw line to mouse
        if (mx !== null && my !== null) {
          const dx = p1.x - mx;
          const dy = p1.y - my;
          const dist = Math.hypot(dx, dy);

          if (dist < mRadius) {
            const force = (mRadius - dist) / mRadius;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = `rgba(0, 245, 255, ${force * 0.15})`;
            ctx.lineWidth = force * 0.8;
            ctx.stroke();
          }
        }

        // Draw line to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 100) {
            const force = (100 - dist) / 100;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${force * 0.08})`;
            ctx.lineWidth = force * 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawPlexus);
    };

    drawPlexus();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-40 overflow-hidden bg-background">
      {/* Canvas Plexus grid */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Nebula Globs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-aurora pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-aurora pointer-events-none" style={{ animationDelay: '-10s' }} />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-glowColor/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
    </div>
  );
};
