import { useEffect, useRef } from "react";

const Cursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 6}px, ${mouseY - 6}px)`;
      }
    };

    let lastT = 0;
    const animate = (t: number) => {
      requestAnimationFrame(animate);
      if (t - lastT < 16) return; // ~60fps max，避免超频
      lastT = t;
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
      }
    };

    const onEnterInteractive = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = "scale(2.5)";
        dotRef.current.style.opacity = "0.6";
      }
      if (ringRef.current) {
        ringRef.current.style.transform = "scale(1.6)";
        ringRef.current.style.borderColor = "rgba(232, 255, 71, 0.8)";
      }
    };

    const onLeaveInteractive = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = "scale(1)";
        dotRef.current.style.opacity = "1";
      }
      if (ringRef.current) {
        ringRef.current.style.transform = "scale(1)";
        ringRef.current.style.borderColor = "rgba(168, 85, 247, 0.6)";
      }
    };

    document.addEventListener("mousemove", onMove);
    requestAnimationFrame(animate);

    const interactives = document.querySelectorAll("a, button, [data-cursor]");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  );
};

export default Cursor;
