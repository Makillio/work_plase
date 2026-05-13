// ============================================
// Main Navigation & Avatar Management
// ============================================
(function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageSections = document.querySelectorAll('.page-section');
    let currentPageName = 'tasks';

    function switchToPage(pageName) {
        if (currentPageName === pageName) return;
        const currentPage = document.getElementById('page-' + currentPageName);
        const nextPage = document.getElementById('page-' + pageName);
        const currentIndex = Array.from(pageSections).indexOf(currentPage);
        const nextIndex = Array.from(pageSections).indexOf(nextPage);
        const direction = nextIndex > currentIndex ? 1 : -1;
        
        currentPage.style.transform = `translateX(${-direction * 100}%)`;
        currentPage.style.opacity = '0';
        nextPage.style.transform = 'translateX(0)';
        nextPage.style.opacity = '1';
        nextPage.classList.add('active');
        
        setTimeout(() => {
            currentPage.classList.remove('active');
            currentPage.style.transform = '';
            currentPage.style.opacity = '';
        }, 500);
        
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === pageName) btn.classList.add('active');
        });
        currentPageName = pageName;
    }

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            switchToPage(this.getAttribute('data-page'));
        });
    });

    // Avatar upload
    const avatarImg = document.getElementById('avatarImg');
    const avatarInput = document.getElementById('avatarInput');
    document.getElementById('avatarSection').addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                avatarImg.src = ev.target.result;
                localStorage.setItem('vaultAvatar', ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    const saved = localStorage.getItem('vaultAvatar');
    if (saved) avatarImg.src = saved;
})();