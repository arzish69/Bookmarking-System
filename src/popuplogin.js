document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      // Open the signup page in a new tab
      const newTab = window.open('http://localhost:5173/signup', '_blank');
      
      // Optionally, you could close the tab after a certain condition
      // newTab.close();
    });
  }
});
