// Thème clair / sombre : préférence enregistrée, sinon celle du système
export function setupTheme() {
  const themeIcon = document.querySelector('.theme-icon');
  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.classList.remove('fa-sun', 'fa-moon');
    themeIcon.classList.add(theme === 'dark' ? 'fa-moon' : 'fa-sun');
  };

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const initialTheme = localStorage.getItem('theme') || (systemDark.matches ? 'dark' : 'light');
  apply(initialTheme);
  localStorage.setItem('theme', initialTheme);

  // Suit le thème du système tant que l'utilisateur n'a rien choisi
  systemDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) apply(e.matches ? 'dark' : 'light');
  });

  document.querySelector('.theme-btn').addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(theme);
    localStorage.setItem('theme', theme);
  });
}
