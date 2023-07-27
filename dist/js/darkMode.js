if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  console.log('Enabling dark mode')
  document.documentElement.setAttribute('data-bs-theme', 'dark')
}
