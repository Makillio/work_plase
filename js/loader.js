// ============================================
// Vault-Tec Loading Screen Animation
// ============================================
(function() {
    window.addEventListener('load', function() {
        const loadingScreen = document.getElementById('vaultLoadingScreen');
        const pipboyApp = document.getElementById('pipboyApp');
        
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
            pipboyApp.style.display = 'flex';
            pipboyApp.style.animation = 'fadeIn 0.5s ease';
            setTimeout(function() {
                loadingScreen.remove();
            }, 500);
        }, 3000);
    });
})();