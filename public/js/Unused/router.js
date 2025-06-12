// js/router.js
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.appContainer = document.getElementById('app');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Initialize router
        this.init();
    }

    // Register a route with its handler
    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    // Initialize the router
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // Handle initial page load
        this.handleRoute();

        // Handle navigation clicks
        this.setupNavigation();
    }

    // Setup click handlers for navigation
    setupNavigation() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigateTo(route);
            }
        });

        // Mobile menu toggle
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on a link
            navMenu.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        }
    }

    // Navigate to a specific route
    navigateTo(path) {
        // Update URL without page reload
        history.pushState(null, null, `#${path}`);
        this.handleRoute();
    }

    // Handle current route
    async handleRoute() {
        const path = this.getPath();
        
        // Update active navigation link
        this.updateActiveNavLink(path);

        // Show loading spinner
        this.showLoading();

        try {
            if (this.routes[path]) {
                await this.routes[path]();
            } else {
                // Default to home if route not found
                await this.routes['home']();
            }
        } catch (error) {
            console.error('Error loading route:', error);
            this.renderError('Failed to load page');
        } finally {
            // Hide loading spinner
            this.hideLoading();
        }

        this.currentRoute = path;
    }

    // Get current path from hash
    getPath() {
        const hash = window.location.hash.slice(1);
        return hash || 'home';
    }

    // Update active navigation link
    updateActiveNavLink(currentPath) {
        const navLinks = document.querySelectorAll('[data-route]');
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Show loading spinner
    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('hidden');
        }
    }

    // Hide loading spinner
    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('hidden');
        }
    }

    // Render content to the app container
    render(content) {
        if (this.appContainer) {
            this.appContainer.innerHTML = content;
            // Add fade-in animation
            this.appContainer.querySelector('.page')?.classList.add('page');
        }
    }

    // Render error page
    renderError(message) {
        const errorContent = `
            <div class="page">
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">Error</h1>
                        <p class="page-subtitle">${message}</p>
                    </div>
                    <div class="card">
                        <p>Something went wrong. Please try again or contact support.</p>
                        <button class="btn" onclick="window.location.reload()">Reload Page</button>
                    </div>
                </div>
            </div>
        `;
        this.render(errorContent);
    }

    // Load external HTML file (for component-based architecture)
    async loadComponent(componentPath) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentPath}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading component:', error);
            return `<div class="error">Failed to load component</div>`;
        }
    }
}

// Page Templates
const PageTemplates = {
    home: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Welcome to Medical Specialist</h1>
                    <p class="page-subtitle">Your trusted healthcare partner</p>
                </div>
                
                <div class="card">
                    <h3>About Our Services</h3>
                    <p>We provide comprehensive medical services with experienced specialists. Our platform connects you with the best healthcare professionals in your area.</p>
                </div>

                <div class="card">
                    <h3>Why Choose Us?</h3>
                    <ul>
                        <li>Qualified Medical Specialists</li>
                        <li>Easy Online Booking</li>
                        <li>Secure Patient Records</li>
                        <li>24/7 Support</li>
                    </ul>
                </div>
            </div>
        </div>
    `,

    about: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">About Us</h1>
                    <p class="page-subtitle">Learn more about our mission and values</p>
                </div>
                
                <div class="card">
                    <h3>Our Mission</h3>
                    <p>To provide accessible, high-quality healthcare services through innovative technology and compassionate care.</p>
                </div>

                <div class="card">
                    <h3>Our Team</h3>
                    <p>We work with certified medical professionals who are dedicated to providing excellent patient care and maintaining the highest standards of medical practice.</p>
                </div>

                <div class="card">
                    <h3>Our Values</h3>
                    <ul>
                        <li><strong>Excellence:</strong> We strive for the highest quality in everything we do</li>
                        <li><strong>Compassion:</strong> We treat every patient with care and understanding</li>
                        <li><strong>Innovation:</strong> We embrace technology to improve healthcare delivery</li>
                        <li><strong>Integrity:</strong> We maintain the highest ethical standards</li>
                    </ul>
                </div>
            </div>
        </div>
    `,

    services: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Our Services</h1>
                    <p class="page-subtitle">Comprehensive healthcare solutions</p>
                </div>
                
                <div class="card">
                    <h3>🩺 General Medicine</h3>
                    <p>Comprehensive primary care services including routine check-ups, preventive care, and treatment of common conditions.</p>
                </div>

                <div class="card">
                    <h3>❤️ Cardiology</h3>
                    <p>Specialized heart care including diagnosis and treatment of cardiovascular diseases, heart monitoring, and cardiac rehabilitation.</p>
                </div>

                <div class="card">
                    <h3>🧠 Neurology</h3>
                    <p>Expert care for neurological conditions including headaches, seizures, movement disorders, and cognitive issues.</p>
                </div>

                <div class="card">
                    <h3>🦴 Orthopedics</h3>
                    <p>Treatment of musculoskeletal conditions including bone, joint, muscle, and ligament problems.</p>
                </div>

                <div class="card">
                    <h3>👁️ Ophthalmology</h3>
                    <p>Complete eye care services including vision exams, treatment of eye diseases, and surgical procedures.</p>
                </div>
            </div>
        </div>
    `,

    contact: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Contact Us</h1>
                    <p class="page-subtitle">Get in touch with our team</p>
                </div>
                
                <div class="card">
                    <h3>Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 1rem;">
                        <div>
                            <h4>📍 Address</h4>
                            <p>123 Medical Center Drive<br>Nairobi, Kenya</p>
                        </div>
                        <div>
                            <h4>📞 Phone</h4>
                            <p>+254 123 456 789</p>
                        </div>
                        <div>
                            <h4>✉️ Email</h4>
                            <p>info@medicalspecialist.com</p>
                        </div>
                        <div>
                            <h4>🕒 Hours</h4>
                            <p>Mon-Fri: 8:00 AM - 6:00 PM<br>Sat: 9:00 AM - 2:00 PM</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Send us a Message</h3>
                    <form id="contact-form">
                        <div class="form-group">
                            <label class="form-label" for="name">Name</label>
                            <input type="text" id="name" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <input type="email" id="email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="subject">Subject</label>
                            <input type="text" id="subject" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="message">Message</label>
                            <textarea id="message" class="form-input" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    `,

    login: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Login</h1>
                    <p class="page-subtitle">Access your account</p>
                </div>
                
                <div class="card" style="max-width: 400px; margin: 0 auto;">
                    <form id="login-form">
                        <div class="form-group">
                            <label class="form-label" for="login-email">Email</label>
                            <input type="email" id="login-email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="login-password">Password</label>
                            <input type="password" id="login-password" class="form-input" required>
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">Login</button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 1rem;">
                        <p>Don't have an account? <a href="#register" data-route="register">Register here</a></p>
                    </div>
                </div>
            </div>
        </div>
    `,

    register: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Register</h1>
                    <p class="page-subtitle">Create your account</p>
                </div>
                
                <div class="card" style="max-width: 400px; margin: 0 auto;">
                    <form id="register-form">
                        <div class="form-group">
                            <label class="form-label" for="register-name">Full Name</label>
                            <input type="text" id="register-name" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="register-email">Email</label>
                            <input type="email" id="register-email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="register-password">Password</label>
                            <input type="password" id="register-password" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="register-confirm-password">Confirm Password</label>
                            <input type="password" id="register-confirm-password" class="form-input" required>
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">Register</button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 1rem;">
                        <p>Already have an account? <a href="#login" data-route="login">Login here</a></p>
                    </div>
                </div>
            </div>
        </div>
    `,

    dashboard: () => `
        <div class="page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">Welcome back!</p>
                </div>
                
                <div class="card">
                    <h3>Your Account</h3>
                    <p>Manage your appointments, view medical records, and update your profile.</p>
                    <button class="btn" onclick="auth.signOut()">Logout</button>
                </div>
            </div>
        </div>
    `
};

// Export router and templates
export { Router, PageTemplates };