import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyBWkXxtI9514_YD6H4kQ6IgltPoSSf7W80",
    authDomain: "medical-specialist-app-d3a46.firebaseapp.com",
    projectId: "medical-specialist-app-d3a46",
    storageBucket: "medical-specialist-app-d3a46.appspot.com",
    messagingSenderId: "990201081362",
    appId: "1:990201081362:web:273dbe33edbbee6f2bb2cb",
    measurementId: "G-ECMD5067CE"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- Utility functions ---
const utils = {
    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    showMessage: (message, type = 'info') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error' : 'success';
        messageDiv.textContent = message;
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
        }, 5000);
    },
    formatDate: (timestamp) => {
        if (!timestamp) return new Date().toLocaleDateString();
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    truncateText: (text, maxLength) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// --- Firestore service for medical resources ---
const resourceService = {
    async getAllResources() {
        const snapshot = await getDocs(collection(db, 'healthResources'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getBookmarkedResources(userId) {
        const docRef = doc(db, 'userBookmarks', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().bookmarks || [] : [];
    },
    async toggleBookmark(userId, resourceId) {
        const docRef = doc(db, 'userBookmarks', userId);
        const docSnap = await getDoc(docRef);
        let bookmarks = docSnap.exists() ? docSnap.data().bookmarks || [] : [];
        const index = bookmarks.indexOf(resourceId);
        if (index === -1) {
            bookmarks.push(resourceId);
        } else {
            bookmarks.splice(index, 1);
        }
        await setDoc(docRef, { bookmarks });
        return bookmarks;
    }
};

// --- State ---
let currentUser = null;
let userBookmarks = [];
let allResources = [];
let filteredResources = [];
let currentTab = 'all';

// --- UI Management ---
const ui = {
    displayResources(resources) {
        const resourcesList = document.getElementById('resourcesList');
        if (!resources || resources.length === 0) {
            resourcesList.innerHTML = currentTab === 'bookmarked'
                ? `<div class="empty-state"><i class="far fa-bookmark"></i><h3>No Bookmarked Resources</h3><p>You haven't bookmarked any resources yet. Click the bookmark icon on resources to save them here.</p></div>`
                : `<div class="empty-state"><i class="fas fa-search"></i><h3>No Resources Found</h3><p>Try adjusting your search or filters to find what you're looking for.</p></div>`;
            return;
        }
        const resourcesGrid = document.createElement('div');
        resourcesGrid.className = 'resources-grid';
        resourcesGrid.innerHTML = resources.map(resource => {
            const title = utils.escapeHtml(resource.title);
            const summary = utils.escapeHtml(resource.summary);
            const category = utils.escapeHtml(resource.category);
            const imageUrl = resource.imageUrl || 'https://via.placeholder.com/400x200/4b6cb7/ffffff?text=Health+Resource';
            const isBookmarked = currentUser ? userBookmarks.includes(resource.id) : false;
            return `
                        <div class="resource-card">
                            ${currentUser ? `
                                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark('${resource.id}')">
                                    <i class="fas fa-bookmark"></i>
                                </button>
                            ` : ''}
                            <img src="${imageUrl}" alt="${title}" class="resource-image" onerror="this.src='https://via.placeholder.com/400x200/4b6cb7/ffffff?text=Health+Resource'">
                            <div class="resource-content">
                                <h3 class="resource-title">${title}</h3>
                                <div class="resource-meta">
                                    <span class="resource-category">${category}</span>
                                    <span>${utils.formatDate(resource.createdAt?.seconds ? resource.createdAt.seconds * 1000 : resource.createdAt)}</span>
                                </div>
                                <p class="resource-summary">${summary}</p>
                                <div class="resource-tags">
                                    ${resource.tags ? resource.tags.map(tag => `<span class="resource-tag">${utils.escapeHtml(tag)}</span>`).join('') : ''}
                                </div>
                                <div class="resource-actions">
                                    <button class="btn-small btn-view" onclick="viewResource('${resource.id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('');
        resourcesList.innerHTML = '';
        resourcesList.appendChild(resourcesGrid);
    },
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(allResources.map(r => r.category))].sort();
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    },
    switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        searchFilter.applyFilters();
    }
};

// --- Search and Filter functionality ---
const searchFilter = {
    init() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortBy = document.getElementById('sortBy');
        const clearFilters = document.getElementById('clearFilters');
        searchInput.addEventListener('input', this.applyFilters.bind(this));
        categoryFilter.addEventListener('change', this.applyFilters.bind(this));
        sortBy.addEventListener('change', this.applyFilters.bind(this));
        clearFilters.addEventListener('click', this.clearAllFilters.bind(this));
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                ui.switchTab(tab.dataset.tab);
            });
        });
    },
    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        let filtered = [...allResources];
        if (currentTab === 'bookmarked') {
            if (!currentUser) {
                filtered = [];
            } else {
                filtered = filtered.filter(resource => userBookmarks.includes(resource.id));
            }
        }
        if (searchTerm) {
            filtered = filtered.filter(resource => {
                return (
                    (resource.title && resource.title.toLowerCase().includes(searchTerm)) ||
                    (resource.content && resource.content.toLowerCase().includes(searchTerm)) ||
                    (resource.summary && resource.summary.toLowerCase().includes(searchTerm)) ||
                    (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                );
            });
        }
        if (categoryFilter) {
            filtered = filtered.filter(resource => resource.category === categoryFilter);
        }
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                    const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                    return bTime - aTime;
                case 'oldest':
                    const aTimeOld = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                    const bTimeOld = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                    return aTimeOld - bTimeOld;
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'category':
                    return (a.category || '').localeCompare(b.category || '');
                default:
                    const aTimeDef = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
                    const bTimeDef = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
                    return bTimeDef - aTimeDef;
            }
        });
        filteredResources = filtered;
        ui.displayResources(filtered);
    },
    clearAllFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('sortBy').value = 'newest';
        this.applyFilters();
    }
};

// --- Main application functions ---
async function loadAndDisplayResources() {
    try {
        document.getElementById('resourcesList').innerHTML = '<div class="loading">Loading health resources...</div>';
        allResources = await resourceService.getAllResources();
        if (currentUser) {
            userBookmarks = await resourceService.getBookmarkedResources(currentUser.uid);
        } else {
            userBookmarks = [];
        }
        searchFilter.applyFilters();
        ui.populateCategoryFilter();
    } catch (error) {
        console.error('Error loading resources:', error);
        utils.showMessage('Error loading resources. Please refresh the page.', 'error');
        document.getElementById('resourcesList').innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error Loading Resources</h3>
                        <p>Please refresh the page to try again.</p>
                    </div>
                `;
    }
}

// --- Bookmark functionality ---
window.toggleBookmark = async function (resourceId) {
    if (!currentUser) {
        utils.showMessage('Please sign in to bookmark resources.', 'error');
        return;
    }
    try {
        userBookmarks = await resourceService.toggleBookmark(currentUser.uid, resourceId);
        searchFilter.applyFilters();
        const resource = allResources.find(r => r.id === resourceId);
        if (resource) {
            const message = userBookmarks.includes(resourceId)
                ? `"${resource.title}" added to bookmarks`
                : `"${resource.title}" removed from bookmarks`;
            utils.showMessage(message, 'success');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        utils.showMessage('Failed to update bookmark. Please try again.', 'error');
    }
};

// --- Modal functionality ---
window.viewResource = function (resourceId) {
    const resource = allResources.find(r => r.id === resourceId);
    if (!resource) return;
    const modal = document.getElementById('resourceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalTitle.textContent = resource.title;
    const imageHtml = resource.imageUrl ?
        `<img src="${resource.imageUrl}" alt="${utils.escapeHtml(resource.title)}" class="resource-detail-image" onerror="this.style.display='none'">` : '';
    const externalLinkHtml = resource.externalLink ?
        `<a href="${resource.externalLink}" target="_blank" class="external-link"><i class="fas fa-external-link-alt"></i> View External Resource</a>` : '';
    modalBody.innerHTML = `
                ${imageHtml}
                <div class="resource-meta">
                    <span class="resource-category">${utils.escapeHtml(resource.category)}</span>
                    <span>Created: ${utils.formatDate(resource.createdAt?.seconds ? resource.createdAt.seconds * 1000 : resource.createdAt)}</span>
                </div>
                <div class="resource-tags" style="margin: 15px 0;">
                    ${resource.tags ? resource.tags.map(tag =>
        `<span class="resource-tag">${utils.escapeHtml(tag)}</span>`
    ).join('') : ''}
                </div>
                <h3 style="margin: 20px 0 10px 0; color: #2c3e50;">Summary</h3>
                <p style="color: #5d6d7e; line-height: 1.6; margin-bottom: 20px;">${utils.escapeHtml(resource.summary)}</p>
                <h3 style="margin: 20px 0 10px 0; color: #2c3e50;">Full Content</h3>
                <div class="resource-content-full">${utils.escapeHtml(resource.content)}</div>
                ${externalLinkHtml}
            `;
    modal.style.display = 'block';
};
window.closeModal = function () {
    document.getElementById('resourceModal').style.display = 'none';
};

// --- Initialize application ---
document.addEventListener('DOMContentLoaded', async function () {
    try {
        searchFilter.init();
        onAuthStateChanged(auth, async (user) => {
            const wasLoggedIn = currentUser !== null;
            currentUser = user;
            await loadAndDisplayResources();
            if (user) {
                if (!wasLoggedIn) {
                    utils.showMessage('Welcome! You can now bookmark resources.', 'success');
                }
            } else {
                if (currentTab === 'bookmarked') {
                    ui.switchTab('all');
                }
                window.location.href = '/login.html';
            }
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        utils.showMessage('Failed to initialize application. Please refresh the page.', 'error');
    }
});
window.addEventListener('click', function (event) {
    const modal = document.getElementById('resourceModal');
    if (event.target === modal) closeModal();
});
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeModal();
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
    }
});
