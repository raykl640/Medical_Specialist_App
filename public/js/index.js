// Wait for Firebase to be loaded before checking auth
window.addEventListener('load', function () {
    if (window.firebaseAuth) {
        // Import onAuthStateChanged dynamically
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
            .then(({ onAuthStateChanged }) => {
                // Check authentication state when page loads
                onAuthStateChanged(window.firebaseAuth, function (user) {
                    // Skip auth state change if we're in the middle of logging out
                    if (isLoggingOut) return;

                    const loadingScreen = document.getElementById('loadingScreen');
                    const mainApp = document.getElementById('mainApp');

                    if (user) {
                        // User is signed in - show main app
                        console.log('User is authenticated:', user.email);
                        loadAuthenticatedContent(user);

                        // Hide loading screen and show main app
                        loadingScreen.style.display = 'none';
                        mainApp.style.display = 'block';
                    } else {
                        // No user - redirect to login (only if not already logging out)
                        if (!isLoggingOut) {
                            console.log('User not authenticated, redirecting to login');
                            try {
                                window.location.replace('./login.html');
                            } catch (e) {
                                console.log('Replace failed, trying href');
                                window.location.href = './login.html';
                            }
                        }
                    }
                });
            });
    }
});

function loadAuthenticatedContent(user) {
    // Update user initial in profile picture
    const userInitial = document.getElementById('userInitial');
    if (user.displayName) {
        userInitial.textContent = user.displayName.charAt(0).toUpperCase();
    } else if (user.email) {
        userInitial.textContent = user.email.charAt(0).toUpperCase();
    }

    // You can add more user-specific content loading here
    console.log('Loading authenticated content for:', user.email);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('overlay');

    sidebar.classList.toggle('open');

    // On desktop, shift main content; on mobile, show overlay
    if (window.innerWidth > 768) {
        mainContent.classList.toggle('shifted');
    } else {
        overlay.classList.toggle('show');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('overlay');

    sidebar.classList.remove('open');
    mainContent.classList.remove('shifted');
    overlay.classList.remove('show');
}

let isLoggingOut = false; // Prevent multiple logout attempts

function logout() {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    if (confirm('Are you sure you want to log out?')) {
        isLoggingOut = true;

        // Show loading state
        const loadingScreen = document.getElementById('loadingScreen');
        const mainApp = document.getElementById('mainApp');
        loadingScreen.style.display = 'flex';
        mainApp.style.display = 'none';

        if (window.firebaseAuth && window.firebaseSignOut) {
            window.firebaseSignOut(window.firebaseAuth)
                .then(() => {
                    console.log('User logged out successfully');
                    console.log('Current URL:', window.location.href);
                    console.log('Attempting to redirect to login...');
                    // Try multiple redirect approaches
                    try {
                        window.location.replace('./login.html');
                    } catch (e) {
                        console.log('Replace failed, trying href');
                        window.location.href = './login.html';
                    }
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                    isLoggingOut = false;
                    // Hide loading screen on error
                    loadingScreen.style.display = 'none';
                    mainApp.style.display = 'block';
                    alert('Error during logout. Please try again.');
                });
        } else {
            console.error('Firebase auth not available');
            isLoggingOut = false;
            loadingScreen.style.display = 'none';
            mainApp.style.display = 'block';
            alert('Error: Authentication not available');
        }
    }
}

// Handle window resize
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        document.getElementById('overlay').classList.remove('show');
    } else {
        document.getElementById('mainContent').classList.remove('shifted');
    }
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger-menu');

    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(event.target) &&
        !hamburger.contains(event.target)) {
        closeSidebar();
    }
});