// navigation.js - FIXED VERSION
class NavigationManager {
    constructor() {
        this.isLoggingOut = false;
        this.eventListenersAttached = false; // PREVENT DUPLICATE LISTENERS
        this.init();
    }

    async init() {
        await this.loadNavigationHTML();
        this.setupEventListeners();
        this.initializeFirebaseAuth();
    }

    async loadNavigationHTML() {
        try {
            const response = await fetch('./navigation.html');
            console.log('Fetch status:', response.status);
            const html = await response.text();
            console.log('Fetched HTML:', html);

            console.log('Fetching navigation...');

            // Create a temporary div to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Extract and insert the navigation elements
            const titleBar = tempDiv.querySelector('.title-bar');
            const overlay = tempDiv.querySelector('.overlay');
            const sidebar = tempDiv.querySelector('.sidebar');
            
            // Insert at the beginning of the body
            if (titleBar) document.body.insertBefore(titleBar, document.body.firstChild);
            if (overlay) document.body.insertBefore(overlay, document.body.firstChild);
            if (sidebar) document.body.insertBefore(sidebar, document.body.firstChild);

            console.log('Navigation inserted into DOM');

            // Add the main-content class to existing content if it doesn't exist
            let mainContent = document.querySelector('.main-content');

            if (!mainContent) {
                // Wrap existing body content (excluding navigation) in main-content
                const existingContent = Array.from(document.body.children).filter(child => 
                    !child.classList.contains('title-bar') && 
                    !child.classList.contains('overlay') && 
                    !child.classList.contains('sidebar') &&
                    !child.classList.contains('loading-screen')
                );
                
                const mainContentDiv = document.createElement('div');
                mainContentDiv.className = 'main-content';
                mainContentDiv.id = 'mainContent';
                
                existingContent.forEach(element => {
                    mainContentDiv.appendChild(element);
                });
                
                document.body.appendChild(mainContentDiv);
            }
            
            // Check localStorage for sidebar state
            const sidebarState = localStorage.getItem('sidebarOpen');
            if (sidebarState === 'true') {
                this.openSidebar();
            }
            
        } catch (error) {
            console.error('Error loading navigation:', error);
        }
    }

    setupEventListeners() {
        // PREVENT DUPLICATE EVENT LISTENERS
        if (this.eventListenersAttached) {
            console.log('Event listeners already attached, skipping...');
            return;
        }

        // Wait a moment for DOM elements to be ready, then set up listeners
        setTimeout(() => {
            const hamburger = document.querySelector('.hamburger-menu');
            if (hamburger) {
                // REMOVE ANY EXISTING LISTENERS FIRST
                hamburger.removeEventListener('click', this.handleHamburgerClick);
                // ADD THE LISTENER WITH BOUND CONTEXT
                this.handleHamburgerClick = this.handleHamburgerClick.bind(this);
                hamburger.addEventListener('click', this.handleHamburgerClick);
                console.log('Hamburger menu listener attached');
            } else {
                console.log('Hamburger menu not found');
            }

            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.removeEventListener('click', this.handleOverlayClick);
                this.handleOverlayClick = this.handleOverlayClick.bind(this);
                overlay.addEventListener('click', this.handleOverlayClick);
            }

            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.removeEventListener('click', this.handleLogoutClick);
                this.handleLogoutClick = this.handleLogoutClick.bind(this);
                logoutLink.addEventListener('click', this.handleLogoutClick);
            }

            // Mark listeners as attached
            this.eventListenersAttached = true;
        }, 100);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.classList.remove('show');
            }
        });

        document.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", function (e) {
                if (link.hostname === window.location.hostname) {
                    e.preventDefault();
                    document.body.classList.add("fade-out");
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 300);
                }
            });
        });
    }

    // SEPARATE HANDLER METHODS TO PREVENT CONFLICTS
    handleHamburgerClick(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hamburger clicked - single handler');
        this.toggleSidebar();
    }

    handleOverlayClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.closeSidebar();
    }

    handleLogoutClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.logout();
    }

    async initializeFirebaseAuth() {
        try {
            // Import Firebase modules
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
            const { getAuth, onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            
            // Import your Firebase config - with error handling
            let firebaseConfig;
            try {
                const configModule = await import('./firebase-config.js');
                firebaseConfig = configModule.firebaseConfig || configModule.default;
            } catch (configError) {
                console.error('Error loading Firebase config:', configError);
                // Fallback config - replace with your actual Firebase config
                firebaseConfig = {
                    apiKey: "your-api-key",
                    authDomain: "your-project.firebaseapp.com",
                    projectId: "your-project-id",
                    storageBucket: "your-project.appspot.com",
                    messagingSenderId: "123456789",
                    appId: "your-app-id"
                };
                console.warn('Using fallback Firebase config. Please update with your actual config.');
            }

            // Validate config before initializing
            if (!firebaseConfig || !firebaseConfig.apiKey) {
                throw new Error('Invalid Firebase configuration');
            }

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            
            // Make auth available globally
            window.firebaseAuth = auth;
            window.firebaseSignOut = signOut;

            // Check authentication state
            onAuthStateChanged(auth, (user) => {
                if (this.isLoggingOut) return;
                
                const loadingScreen = document.getElementById('loadingScreen');
                const mainApp = document.querySelector('.main-app') || document.body;
                
                if (user) {
                    console.log('User is authenticated:', user.email);
                    this.loadAuthenticatedContent(user);
                    
                    // Hide loading screen if it exists
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                    if (mainApp.classList.contains('main-app')) {
                        mainApp.style.display = 'block';
                    }
                } else {
                    if (!this.isLoggingOut) {
                        console.log('User not authenticated, redirecting to login');
                        try {
                            window.location.replace('./login.html');
                        } catch (e) {
                            window.location.href = '/login.html';
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error initializing Firebase:', error);
            // Don't redirect to login if Firebase fails to initialize
            console.warn('Firebase authentication not available. Navigation will work without auth.');
        }
    }

    loadAuthenticatedContent(user) {
        // Update user initial in profile picture
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            if (user.displayName) {
                userInitial.textContent = user.displayName.charAt(0).toUpperCase();
            } else if (user.email) {
                userInitial.textContent = user.email.charAt(0).toUpperCase();
            }
        }
        
        // Set active nav link based on current page
        this.setActiveNavLink();
    }

    setActiveNavLink() {
        // Get current page name
        const currentPage = window.location.pathname.split('/').pop() || 'patientDashboard.html';
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page link
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.getAttribute('data-page') || link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    }

    toggleSidebar() {
        console.log('Toggle sidebar called');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const overlay = document.getElementById('overlay');
        
        if (sidebar) {
            const wasOpen = sidebar.classList.contains('open');
            sidebar.classList.toggle('open');
            console.log('Sidebar toggled, open:', sidebar.classList.contains('open'));
            console.log('Was open before toggle:', wasOpen);

            // Store sidebar state in localStorage
            localStorage.setItem('sidebarOpen', sidebar.classList.contains('open'));
        } else {
            console.log('Sidebar element not found');
            return;
        }
        
        // On desktop, shift main content; on mobile, show overlay
        if (window.innerWidth > 768) {
            if (mainContent) mainContent.classList.toggle('shifted');
        } else {
            if (overlay) overlay.classList.toggle('show');
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const overlay = document.getElementById('overlay');
        
        if (sidebar) sidebar.classList.add('open');
        if (mainContent && window.innerWidth > 768) mainContent.classList.add('shifted');
        if (overlay && window.innerWidth <= 768) overlay.classList.add('show');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const overlay = document.getElementById('overlay');
        
        if (sidebar) sidebar.classList.remove('open');
        if (mainContent) mainContent.classList.remove('shifted');
        if (overlay) overlay.classList.remove('show');

        // Update localStorage
        localStorage.setItem('sidebarOpen', 'false');
    }

    async logout() {
        if (this.isLoggingOut) return;
        
        if (confirm('Are you sure you want to log out?')) {
            this.isLoggingOut = true;
            
            // Show loading state if loading screen exists
            const loadingScreen = document.getElementById('loadingScreen');
            const mainApp = document.querySelector('.main-app');
            
            if (loadingScreen && mainApp) {
                loadingScreen.style.display = 'flex';
                mainApp.style.display = 'none';
            }
            
            if (window.firebaseAuth && window.firebaseSignOut) {
                try {
                    await window.firebaseSignOut(window.firebaseAuth);
                    console.log('User logged out successfully');
                    window.location.replace('./login.html');
                } catch (error) {
                    console.error('Logout error:', error);
                    this.isLoggingOut = false;
                    
                    // Hide loading screen on error
                    if (loadingScreen && mainApp) {
                        loadingScreen.style.display = 'none';
                        mainApp.style.display = 'block';
                    }
                    alert('Error during logout. Please try again.');
                }
            } else {
                console.error('Firebase auth not available');
                this.isLoggingOut = false;
                alert('Error: Authentication not available');
            }
        }
    }
}

// PREVENT MULTIPLE INSTANCES
if (!window.navigationManager) {
    // Initialize navigation when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing NavigationManager");
        window.navigationManager = new NavigationManager();
    });
}

// Export for module use
export default NavigationManager;

window.addEventListener("DOMContentLoaded", () => {
  fetch("/public/navigation.html")
    .then(res => res.text())
    .then(html => {
      const navbarContainer = document.getElementById("navbar-container");
      if (navbarContainer) {
        navbarContainer.innerHTML = html;

        // Add active class to current nav link
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll(".navbar-list a");

        navLinks.forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
      document.body.classList.remove("preload"); // Show the page
    });
});

document.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", function (e) {
    if (link.hostname === window.location.hostname) {
      e.preventDefault();
      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = link.href;
      }, 300);
    }
  });
});