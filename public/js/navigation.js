import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

class NavigationManager {
    constructor() {
        this.isLoggingOut = false;
        this.eventListenersAttached = false;
        this.appointmentUnsub = null;
        this.medicalUnsubs = [];
        // Bind event handlers once for consistent references
        this.handleHamburgerClick = this.handleHamburgerClick.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.init();
    }

    async init() {
        this.setupNotificationUI();
        this.setupEventListeners();
        this.initializeFirebaseAuth();
    }

    setupNotificationUI() {
        this.unreadCount = 0;
        this.bell = document.getElementById('notificationBell');
        this.badge = document.getElementById('notificationCount');
        this.dropdown = document.getElementById('notificationDropdown');
        this.list = document.getElementById('notificationList');
        this.markAllBtn = document.getElementById('markAllRead');
        if (this.bell) {
            this.bell.addEventListener('click', () => {
                if (this.dropdown) this.dropdown.classList.toggle('hidden');
                this.hideBadge();
            });
        }
        if (this.markAllBtn) {
            this.markAllBtn.addEventListener('click', () => {
                if (this.list) this.list.innerHTML = '';
                if (this.dropdown) this.dropdown.classList.add('hidden');
                this.hideBadge();
            });
        }
        document.addEventListener("appointmentBooked", e => {
            const date = e.detail.date;
            const readableDate = date ? new Date(date).toLocaleString() : '';
            this.showNotification(`📅 Appointment booked for ${readableDate}`);
        });

        document.addEventListener("appointmentRescheduled", e => {
            const { date, time } = e.detail || {};
            const readableDate = date ? new Date(date).toLocaleDateString() : '';
            this.showNotification(`✏️ Appointment rescheduled to ${readableDate} at ${time}`);
        });

        document.addEventListener("appointmentCanceled", () => {
            this.showNotification(`❌ Appointment canceled`);
        });

    }
    showNotification(message) {
        if (!this.list) return;
        const li = document.createElement('li');
        li.textContent = message;
        this.list.prepend(li);
        this.unreadCount++;
        if (this.badge) {
            this.badge.textContent = this.unreadCount;
            this.badge.classList.remove('hidden');
        }
    }
    hideBadge() {
        this.unreadCount = 0;
        if (this.badge) this.badge.classList.add('hidden');
    }
    setupEventListeners() {
        // PREVENT DUPLICATE EVENT LISTENERS
        if (this.eventListenersAttached) {
            console.log('Event listeners already attached, skipping...');
            return;
        }
        setTimeout(() => {
            const hamburger = document.querySelector('.hamburger-menu');
            if (hamburger) {
                hamburger.removeEventListener('click', this.handleHamburgerClick);
                hamburger.addEventListener('click', this.handleHamburgerClick);
                console.log('Hamburger menu listener attached');
            } else {
                console.log('Hamburger menu not found');
            }
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.removeEventListener('click', this.handleOverlayClick);
                overlay.addEventListener('click', this.handleOverlayClick);
            }
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.removeEventListener('click', this.handleLogoutClick);
                logoutLink.addEventListener('click', this.handleLogoutClick);
            }
            this.eventListenersAttached = true;
        }, 100);
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.classList.remove('show');
            }
        });
        document.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", function (e) {
                if (link.hostname === window.location.hostname && !link.classList.contains('no-fade')) {
                    e.preventDefault();
                    document.body.classList.add("fade-out");
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 300);
                }
            });
        });
    }
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
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            this.db = db;
            window.firebaseAuth = auth;
            window.firebaseSignOut = signOut;
            onAuthStateChanged(auth, (user) => {
                if (this.isLoggingOut) return;
                const loadingScreen = document.getElementById('loadingScreen');
                const mainApp = document.querySelector('.main-app') || document.body;
                if (user) {
                    console.log('User is authenticated:', user.email);
                    this.loadAuthenticatedContent(user);
                    this.attachListenersForUser(db, user.uid);

                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                    if (mainApp.classList.contains('main-app')) {
                        mainApp.style.display = 'block';
                    }
                } else {
                    this.detachListeners();
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
    attachListenersForUser(db, uid) {
        // Medical record types
        const recordTypes = ['medicalHistory', 'labTests', 'radiology', 'medications'];
        this.medicalUnsubs = recordTypes.map(type => {
            const recQuery = query(
                collection(db, type),
                where('patientId', '==', uid)
            );
            return onSnapshot(recQuery, snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const name = type.replace(/([A-Z])/g, ' $1');
                        this.showNotification(`🩺 New ${name.trim()} record added`);
                    }
                });
            });
        });
    }
    detachListeners() {
        this.medicalUnsubs.forEach(unsub => unsub && unsub());
        this.medicalUnsubs = [];
    }

    loadAuthenticatedContent(user) {
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            if (user.displayName) {
                userInitial.textContent = user.displayName.charAt(0).toUpperCase();
            } else if (user.email) {
                userInitial.textContent = user.email.charAt(0).toUpperCase();
            }
        }
        this.setActiveNavLink();
    }
    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'patientDashboard.html';

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current page link
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || linkHref === './' + currentPage) {
                link.classList.add('active');
            }
        });
    }

    toggleSidebar() {
        console.log('Toggle sidebar called');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
        const overlay = document.getElementById('overlay');

        if (sidebar) {
            const wasOpen = sidebar.classList.contains('open');
            sidebar.classList.toggle('open');
            console.log('Sidebar toggled, open:', sidebar.classList.contains('open'));

            localStorage.setItem('sidebarOpen', sidebar.classList.contains('open'));
        } else {
            console.log('Sidebar element not found');
            return;
        }
        if (window.innerWidth > 768) {
            if (mainContent) mainContent.classList.toggle('shifted');
        } else {
            if (overlay) overlay.classList.toggle('show');
        }
    }
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
        const overlay = document.getElementById('overlay');

        if (sidebar) sidebar.classList.add('open');
        if (mainContent && window.innerWidth > 768) mainContent.classList.add('shifted');
        if (overlay && window.innerWidth <= 768) overlay.classList.add('show');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
        const overlay = document.getElementById('overlay');

        if (sidebar) sidebar.classList.remove('open');
        if (mainContent) mainContent.classList.remove('shifted');
        if (overlay) overlay.classList.remove('show');

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

if (!window.navigationManager) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing NavigationManager");
        window.navigationManager = new NavigationManager();
    });
}
export default NavigationManager;