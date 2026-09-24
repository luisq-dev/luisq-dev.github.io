import { getStateColors } from "../data/content.js";

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initHeroCanvas() {
  const canvas = document.querySelector("#heroCanvas");
  const hero = document.querySelector("#intro");
  if (!canvas || !hero) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame = 0;
  let visible = !reduceMotion();
  let inViewport = true;
  let resizeFrame = 0;
  let lastFrame = 0;
  const stateColors = getStateColors();

  function resize() {
    const bounds = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(
      28,
      Math.max(16, Math.floor((width * height) / 40000)),
    );
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.6 + 1.8,
      color: stateColors[Math.floor(Math.random() * stateColors.length)],
    }));
    drawFrame();
  }

  function scheduleResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  }

  function drawFrame() {
    context.clearRect(0, 0, width, height);

    for (let first = 0; first < nodes.length; first += 1) {
      for (let second = first + 1; second < nodes.length; second += 1) {
        const dx = nodes[second].x - nodes[first].x;
        const dy = nodes[second].y - nodes[first].y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 150) continue;
        context.save();
        context.globalAlpha = (1 - distance / 150) * 0.18;
        context.strokeStyle = nodes[first].color;
        context.lineWidth = 0.8;
        context.beginPath();
        context.moveTo(nodes[first].x, nodes[first].y);
        context.lineTo(nodes[second].x, nodes[second].y);
        context.stroke();
        context.restore();
      }
    }

    nodes.forEach((node) => {
      context.save();
      context.globalAlpha = 0.68;
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = node.color;
      context.fill();
      context.restore();
    });
  }

  function animate(timestamp = 0) {
    cancelAnimationFrame(animationFrame);
    if (!visible || !inViewport || reduceMotion()) return;
    if (timestamp && timestamp - lastFrame < 32) {
      animationFrame = requestAnimationFrame(animate);
      return;
    }
    lastFrame = timestamp;
    drawFrame();
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < -10 || node.x > width + 10) node.vx *= -1;
      if (node.y < -10 || node.y > height + 10) node.vy *= -1;
    });
    animationFrame = requestAnimationFrame(animate);
  }

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) animate();
      else cancelAnimationFrame(animationFrame);
    },
    { threshold: 0.05 },
  );
  intersectionObserver.observe(hero);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) animate();
    else cancelAnimationFrame(animationFrame);
  });
  window.addEventListener("resize", scheduleResize, { passive: true });
  resize();
}
