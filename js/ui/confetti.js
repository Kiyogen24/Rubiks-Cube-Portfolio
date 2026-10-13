// Pluie de confettis, affichée quand le cube est résolu à la main
export function triggerConfetti(duration = 3000) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  Object.assign(container.style, {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 9999,
  });

  const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff', '#5856d6'];

  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = Math.floor(Math.random() * 10) + 6;
    Object.assign(el.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size * 0.6}px`,
      left: Math.random() * 100 + '%',
      top: -10 - Math.random() * 20 + '%',
      background: colors[Math.floor(Math.random() * colors.length)],
      opacity: (0.6 + Math.random() * 0.4).toString(),
      transform: `rotate(${Math.random() * 360}deg)`,
      borderRadius: '2px',
      willChange: 'transform, top, opacity',
    });

    // durée de chute et dérive horizontale aléatoires
    const fall = 1500 + Math.random() * 2000;
    const horizontal = (Math.random() - 0.5) * 200; // px
    el.animate(
      [
        { transform: `translate3d(0,0,0) rotate(${Math.random() * 360}deg)`, top: el.style.top, opacity: 1 },
        {
          transform: `translate3d(${horizontal}px, 100vh, 0) rotate(${Math.random() * 720}deg)`,
          top: '100vh',
          opacity: 0.8,
        },
      ],
      { duration: fall + Math.random() * 800, iterations: 1, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );

    container.appendChild(el);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), duration + 1000);
}
