const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const openBtn = document.getElementById('sidebarToggle');
const closeBtn = document.getElementById('sidebarClose');

function openSidebar() {
  
    sidebar.classList.add('open');
    overlay.classList.add('show');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

openBtn.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);