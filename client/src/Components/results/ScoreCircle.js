import React, { useEffect, useRef } from "react";

function clampScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const ScoreCircle = ({ score, color, label }) => {
  const safe = clampScore(score);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 64;
    const lineWidth = 11;
    const startAngle = -Math.PI / 2;

    // Read theme-aware colors once per draw cycle so light/dark both render
    // correctly (canvas can't be reached by CSS [data-theme] overrides).
    const styles = getComputedStyle(canvas);
    const trackColor = styles.getPropertyValue("--score-track").trim() || "rgba(148,148,148,0.14)";
    const sealColor = styles.getPropertyValue("--accent-teal").trim() || "#0d9488";

    let progress = 0;
    const target = safe / 100;
    const duration = 1200; // ms
    let startTime = null;

    // easeOutCubic
    function ease(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw(fraction) {
      ctx.clearRect(0, 0, size, size);

      // Outer seal ring - thin decorative medallion edge, the signature touch
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 9, 0, 2 * Math.PI);
      ctx.strokeStyle = sealColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Track ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      if (fraction > 0) {
        const endAngle = startAngle + 2 * Math.PI * fraction;
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, color[0]);
        gradient.addColorStop(1, color[1]);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();

        // Glow effect at tip
        const tipAngle = endAngle;
        const tipX = cx + radius * Math.cos(tipAngle);
        const tipY = cy + radius * Math.sin(tipAngle);
        const glow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, lineWidth * 1.5);
        glow.addColorStop(0, color[0] + "88");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tipX, tipY, lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      progress = ease(Math.min(elapsed / duration, 1));
      draw(progress * target);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    // Cancel any previous animation
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    // If the person toggles dark/light after the ring has already finished
    // animating in, redraw once (no re-animation) so the track/seal colors
    // stay correct for the new theme instead of the last-drawn frame.
    const themeObserver = new MutationObserver(() => {
      if (progress >= 1) draw(target);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      themeObserver.disconnect();
    };
  }, [safe, color]);

  const getScoreColor = (s) => {
    if (s >= 75) return "#10b981"; // emerald
    if (s >= 50) return "#d97706"; // amber
    return "#e11d48"; // rose
  };

  const getScoreLabel = (s) => {
    if (label) return label;
    if (s >= 80) return "Excellent";
    if (s >= 65) return "Good";
    if (s >= 50) return "Average";
    return "Needs Work";
  };

  return (
    <div className="score-circle-wrapper">
      <div className="score-circle" role="img" aria-label={`Score ${safe} out of 100`}>
        <canvas ref={canvasRef} width={160} height={160} aria-hidden="true" />
        <div className="score-circle-num">
          <span className="score-value" style={{ color: getScoreColor(safe) }}>
            {safe}
          </span>
          <span className="score-denom">/ 100</span>
        </div>
      </div>
      <span className="score-label" style={{ color: getScoreColor(safe) }}>
        {getScoreLabel(safe)}
      </span>
    </div>
  );
};

export default ScoreCircle;
