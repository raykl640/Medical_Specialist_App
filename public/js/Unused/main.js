// js/main.js
import { Router, PageTemplates } from './router.js';
import { authManager } from '../auth.js';

class App {
    constructor() {
        this.router = new Router();
        this.authManager = authManager;
        this.init();
    }

    // Initialize the application
    init() {
        // Set up router reference in auth manager
        this.authManager.setRouter(this.router);

        // Register all routes
        this.registerRoutes();

        // Setup global event listeners
        this.setupGlobalListeners();

        // Setup logout functionality
        this.setupLogout();

        console.log('Medical Specialist App initialized');
    }

    // Register all application routes
    registerRoutes() {
        // Public routes
        this.router.addRoute('home', () => {
            this.router.render(PageTemplates.home());
        });

        this.router.addRoute('about', () => {
            this.router.render(PageTemplates.about());
        });

        this.router.addRoute('services', () => {
            this.router.render(PageTemplates.services());
        });

        this.router.addRoute('contact', () => {
            this.router.render(PageTemplates.contact());
        });

        // Auth routes
        this.router.addRoute('login', () => {
            // Redirect to dashboard if already logged in
            if (this.authManager.isAuthenticated()) {
                this.router.navigateTo('dashboard');
                return;
            }
            this.router.render(PageTemplates.login());
        });

        this.router.addRoute('register', () => {
            // Redirect to dashboard if already logged in
            if (this.authManager.isAuthenticated()) {
                this.router.navigateTo('dashboard');
                return;
            }
            this.router.render(PageTemplates.register());
        });

        // Protected routes
        this.router.addRoute('dashboard', async () => {
            // Redirect to login if not authenticated
            if (!this.authManager.isAuthenticated()) {
                this.router.navigateTo('login');
                return;
            }
            
            // Load dashboard with user data
            const userData = await this.authManager.getUserData(this.authManager.getCurrentUser().uid);
            this.router.render(this.getDashboardContent(userData));
        });

        // Additional protected routes can be added here
        this.router.addRoute('profile', async () => {
            if (!this.authManager.isAuthenticated()) {
                this.router.navigateTo('login');
                return;
            }
            this.router.render(this.getProfileContent());
        });

        this.router.addRoute('appointments', async () => {
            if (!this.authManager.isAuthenticated()) {
                this.router.navigateTo('login');
                return;
            }
            this.router.render(this.getAppointmentsContent());
        });
    }

    // Setup global event listeners
    setupGlobalListeners() {
        // Handle window resize for responsive design
        window.addEventListener('resize', this.handleResize.bind(this));

        // Handle offline/online status
        window.addEventListener('online', () => {
            this.authManager.showMessage('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.authManager.showMessage('You are offline', 'warning');
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + H for Home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                this.router.navigateTo('home');
            }
            // Alt + L for Login/Dashboard
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                if (this.authManager.isAuthenticated()) {
                    this.router.navigateTo('dashboard');
                } else {
                    this.router.navigateTo('login');
                }
            }
            // Escape to close mobile menu
            if (e.key === 'Escape') {
                const navMenu = document.getElementById('nav-menu');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            }
        });
    }

    // Setup logout functionality
    setupLogout() {
        // Global logout function
        window.logout = () => {
            this.authManager.handleLogout();
        };

        // Listen for logout clicks in dashboard
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.textContent === 'Logout') {
                e.preventDefault();
                this.authManager.handleLogout();
            }
        });
    }

    // Handle window resize
    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 768) {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        }
    }

    // Get dashboard content with user data
    getDashboardContent(userData) {
        const user = this.authManager.getCurrentUser();
        const displayName = user.displayName || userData?.name || 'User';
        
        return `
            <div class="page">
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">Welcome back, ${displayName}!</h1>
                        <p class="page-subtitle">Manage your healthcare from your dashboard</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                        <div class="card">
                            <h3>📅 Appointments</h3>
                            <p>View and manage your upcoming appointments with medical specialists.</p>
                            <button class="btn" onclick="app.router.navigateTo('appointments')">View Appointments</button>
                        </div>

                        <div class="card">
                            <h3>👤 Profile</h3>
                            <p>Update your personal information and medical history.</p>
                            <button class="btn" onclick="app.router.navigateTo('profile')">Edit Profile</button>
                        </div>

                        <div class="card">
                            <h3>📋 Medical Records</h3>
                            <p>Access your medical records and test results securely.</p>
                            <button class="btn">View Records</button>
                        </div>

                        <div class="card">
                            <h3>💬 Messages</h3>
                            <p>Communicate with your healthcare providers.</p>
                            <button class="btn">View Messages</button>
                        </div>
                    </div>

                    <div class="card" style="margin-top: 2rem;">
                        <h3>Account Information</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Email:</strong> ${user.email}
                            </div>
                            <div>
                                <strong>Account Type:</strong> ${userData?.role || 'Patient'}
                            </div>
                            <div>
                                <strong>Member Since:</strong> ${userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <div style="margin-top: 1rem;">
                            <button class="btn" id="logout-btn">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Get profile content
    getProfileContent() {
        const user = this.authManager.getCurrentUser();
        
        return `
            <div class="page">
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">Profile Settings</h1>
                        <p class="page-subtitle">Update your personal information</p>
                    </div>
                    
                    <div class="card" style="max-width: 600px; margin: 0 auto;">
                        <form id="profile-form">
                            <div class="form-group">
                                <label class="form-label" for="profile-name">Full Name</label>
                                <input type="text" id="profile-name" class="form-input" value="${user.displayName || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="profile-email">Email</label>
                                <input type="email" id="profile-email" class="form-input" value="${user.email}" readonly style="background-color: #f8f9fa;">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="profile-phone">Phone Number</label>
                                <input type="tel" id="profile-phone" class="form-input" placeholder="+254 123 456 789">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="profile-dob">Date of Birth</label>
                                <input type="date" id="profile-dob" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="profile-address">Address</label>
                                <textarea id="profile-address" class="form-input" rows="3" placeholder="Your address"></textarea>
                            </div>
                            <button type="submit" class="btn">Update Profile</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // Get appointments content
    getAppointmentsContent() {
        return `
            <div class="page">
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">My Appointments</h1>
                        <p class="page-subtitle">Manage your medical appointments</p>
                    </div>
                    
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h3>Upcoming Appointments</h3>
                            <button class="btn">Book New Appointment</button>
                        </div>
                        
                        <div class="appointments-list">
                            <div class="appointment-item" style="border: 1px solid #e9ecef; border-radius: 5px; padding: 1rem; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <h4>Dr. Sarah Johnson - Cardiology</h4>
                                        <p>📅 June 15, 2025 at 2:00 PM</p>
                                        <p>📍 Medical Center, Room 205</p>
                                    </div>
                                    <div>
                                        <button class="btn" style="margin-right: 0.5rem;">Reschedule</button>
                                        <button class="btn" style="background-color: #dc3545;">Cancel</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="appointment-item" style="border: 1px solid #e9ecef; border-radius: 5px; padding: 1rem; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <h4>Dr. Michael Chen - General Medicine</h4>
                                        <p>📅 June 20, 2025 at 10:30 AM</p>
                                        <p>📍 Medical Center, Room 101</p>
                                    </div>
                                    <div>
                                        <button class="btn" style="margin-right: 0.5rem;">Reschedule</button>
                                        <button class="btn" style="background-color: #dc3545;">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3>Past Appointments</h3>
                        <div class="appointments-list">
                            <div class="appointment-item" style="border: 1px solid #e9ecef; border-radius: 5px; padding: 1rem; margin-bottom: 1rem; opacity: 0.7;">
                                <div>
                                    <h4>Dr. Emily Davis - Dermatology</h4>
                                    <p>📅 May 28, 2025 at 3:15 PM - Completed</p>
                                    <p>📍 Medical Center, Room 310</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new App();
});

// Export for module usage
export default App;