// La section du cube occupe-t-elle tout l'écran ? (tolérance de quelques pixels)
export function isCubeSectionInView() {
  const rect = document.getElementById('cube-section').getBoundingClientRect();
  return rect.top <= 1 && rect.bottom >= window.innerHeight - 2;
}
