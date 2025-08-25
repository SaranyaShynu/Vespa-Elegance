


  function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');

  if (window.innerWidth <= 768) {
    // Mobile behavior
    sidebar.classList.toggle('active');
  } else {
    // Desktop collapse behavior
    sidebar.classList.toggle('collapsed');
  }
}



