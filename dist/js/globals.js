// Show a Toast message
function showToast (toastElement, toastMessageElement, message) {
  toastMessageElement.innerHTML = message
  toastElement.classList.add('show')
  setTimeout(function () { closeToast(toastElement) }, 3000)
}

// Close the toast
function closeToast (toastElement) {
  toastElement.classList.remove('show')
}

// Set light or dark mode
function setDarkMode () {
  const darkMode = localStorage.getItem('darkMode') === 'true'
  if (darkMode) {
    document.body.classList.add('dark-mode')
    document.body.classList.remove('light-mode')
  } else {
    document.body.classList.add('light-mode')
    document.body.classList.remove('dark-mode')
  }
}

export { showToast, closeToast, setDarkMode }
