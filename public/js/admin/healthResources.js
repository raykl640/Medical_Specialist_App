
// Import centralized Firebase config and services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
const db = getFirestore(app);

// Utility functions (reuse your utils object as before)
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
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    },

    generateResourceId: () => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `RES_${timestamp}_${randomStr}`.toUpperCase();
    },

    formatDate: (timestamp) => {
        if (!timestamp) return new Date().toLocaleDateString();
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    truncateText: (text, maxLength) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// Firestore service for health resources
const resourceService = {
    async getAllResources() {
        const snapshot = await getDocs(collection(db, 'healthResources'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async addResource(resourceData) {
        const docRef = await addDoc(collection(db, 'healthResources'), {
            ...resourceData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },
    async updateResource(resourceId, resourceData) {
        await updateDoc(doc(db, 'healthResources', resourceId), {
            ...resourceData,
            updatedAt: serverTimestamp()
        });
    },
    async deleteResource(resourceId) {
        await deleteDoc(doc(db, 'healthResources', resourceId));
    }
};

// Replace allResources and filteredResources with Firestore data
let allResources = [];
let filteredResources = [];
let selectedTags = [];
let currentEditingId = null;

// Tags management
const tagsManager = {
    init() {
        const tagInput = document.getElementById('tagInput');

        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(tagInput.value.trim());
                tagInput.value = '';
            }
        });

        tagInput.addEventListener('blur', () => {
            if (tagInput.value.trim()) {
                this.addTag(tagInput.value.trim());
                tagInput.value = '';
            }
        });
    },

    addTag(tagText) {
        if (!tagText || selectedTags.includes(tagText.toLowerCase())) return;

        selectedTags.push(tagText.toLowerCase());
        this.renderTags();
    },

    removeTag(tagText) {
        selectedTags = selectedTags.filter(tag => tag !== tagText);
        this.renderTags();
    },

    renderTags() {
        const tagsContainer = document.getElementById('tagsContainer');
        const tagInput = document.getElementById('tagInput');

        tagsContainer.innerHTML = '';

        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                        ${utils.escapeHtml(tag)}
                        <span class="remove-tag" onclick="tagsManager.removeTag('${tag}')">×</span>
                    `;
            tagsContainer.appendChild(tagElement);
        });

        tagsContainer.appendChild(tagInput);
    },

    getTags() {
        return selectedTags;
    },

    clearTags() {
        selectedTags = [];
        this.renderTags();
    },

    setTags(tags) {
        selectedTags = [...tags];
        this.renderTags();
    }
};

// UI Management
const ui = {
    displayResources(resources) {
        const resourcesList = document.getElementById('resourcesList');

        if (!resources || resources.length === 0) {
            resourcesList.innerHTML = '<div class="loading">No resources found. Add your first health resource above! 📚</div>';
            return;
        }

        const resourcesGrid = document.createElement('div');
        resourcesGrid.className = 'resources-grid';

        resourcesGrid.innerHTML = resources.map(resource => {
            const title = utils.escapeHtml(resource.title);
            const summary = utils.escapeHtml(resource.summary);
            const category = utils.escapeHtml(resource.category);
            const resource_Id = resource.resource_Id || 'N/A';
            const imageUrl = resource.imageUrl || 'https://via.placeholder.com/400x200/667eea/ffffff?text=Medical+Resource';

            return `
                        <div class="resource-card">
                            <img src="${imageUrl}" alt="${title}" class="resource-image" onerror="this.src='https://via.placeholder.com/400x200/667eea/ffffff?text=Medical+Resource'">
                            <div class="resource-content">
                                <div class="resource-id">ID: ${resource_Id}</div>
                                <h3 class="resource-title">${title}</h3>
                                <div class="resource-meta">
                                    <span class="resource-category">${category}</span>
                                    <span>${utils.formatDate(resource.createdAt?.seconds ? resource.createdAt.seconds * 1000 : resource.createdAt)}</span>
                                </div>
                                <p class="resource-summary">${summary}</p>
                                <div class="resource-tags">
                                    ${resource.tags ? resource.tags.map(tag =>
                `<span class="resource-tag">${utils.escapeHtml(tag)}</span>`
            ).join('') : ''}
                                </div>
                                <div class="resource-actions">
                                    <button class="btn-small btn-view" onclick="viewResource('${resource.id}')">
                                        👁️ View
                                    </button>
                                    <button class="btn-small btn-edit" onclick="editResource('${resource.id}')">
                                        ✏️ Edit
                                    </button>
                                    <button class="btn-small btn-delete" onclick="deleteResource('${resource.id}')">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('');

        resourcesList.innerHTML = '';
        resourcesList.appendChild(resourcesGrid);
    },

    updateStats() {
        const categories = [...new Set(allResources.map(r => r.category))].length;
        const recentlyAdded = allResources.filter(r =>
            Date.now() - r.createdAt?.seconds * 1000 < 7 * 24 * 60 * 60 * 1000
        ).length;
        const allTags = [...new Set(allResources.flatMap(r => r.tags || []))].length;

        document.getElementById('totalResources').textContent = allResources.length;
        document.getElementById('totalCategories').textContent = categories;
        document.getElementById('recentlyAdded').textContent = recentlyAdded;
        document.getElementById('totalTags').textContent = allTags;
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
    }
};

// Search and Filter functionality
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
    },

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        let filtered = [...allResources];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(resource => {
                return (
                    resource.title.toLowerCase().includes(searchTerm) ||
                    resource.content.toLowerCase().includes(searchTerm) ||
                    resource.summary.toLowerCase().includes(searchTerm) ||
                    (resource.tags && resource.tags.some(tag =>
                        tag.toLowerCase().includes(searchTerm)
                    ))
                );
            });
        }

        // Apply category filter
        if (categoryFilter) {
            filtered = filtered.filter(resource => resource.category === categoryFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.createdAt?.seconds * 1000 - a.createdAt?.seconds * 1000;
                case 'oldest':
                    return a.createdAt?.seconds * 1000 - b.createdAt?.seconds * 1000;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return b.createdAt?.seconds * 1000 - a.createdAt?.seconds * 1000;
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

// Form management
const formManager = {
    init() {
        const form = document.getElementById('resourceForm');
        form.addEventListener('submit', this.handleSubmit.bind(this));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const resourceData = {
            title: formData.get('title').trim(),
            category: formData.get('category'),
            summary: formData.get('summary').trim(),
            content: formData.get('content').trim(),
            imageUrl: formData.get('imageUrl').trim() || null,
            externalLink: formData.get('externalLink').trim() || null,
            tags: tagsManager.getTags()
        };

        // Validation
        if (!resourceData.title || !resourceData.category || !resourceData.summary || !resourceData.content) {
            utils.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        if (resourceData.summary.length > 200) {
            utils.showMessage('Summary must be 200 characters or less.', 'error');
            return;
        }

        try {
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = currentEditingId ? '🔄 Updating...' : '🔄 Adding...';

            if (currentEditingId) {
                await resourceService.updateResource(currentEditingId, resourceData);
                utils.showMessage('Resource updated successfully! ✅', 'success');
                this.cancelEdit();
            } else {
                await resourceService.addResource(resourceData);
                utils.showMessage('Resource added successfully! ✅', 'success');
            }

            this.resetForm();
            await loadAndDisplayResources();

        } catch (error) {
            console.error('Error saving resource:', error);
            utils.showMessage(error.message, 'error');
        } finally {
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = currentEditingId ? '📝 Update Resource' : '📚 Add Resource';
        }
    },

    resetForm() {
        document.getElementById('resourceForm').reset();
        tagsManager.clearTags();
    },

    populateForm(resource) {
        document.getElementById('title').value = resource.title || '';
        document.getElementById('category').value = resource.category || '';
        document.getElementById('summary').value = resource.summary || '';
        document.getElementById('content').value = resource.content || '';
        document.getElementById('imageUrl').value = resource.imageUrl || '';
        document.getElementById('externalLink').value = resource.externalLink || '';

        tagsManager.setTags(resource.tags || []);
    },

    startEdit(resourceId) {
        const resource = allResources.find(r => r.id === resourceId);
        if (!resource) return;

        currentEditingId = resourceId;
        this.populateForm(resource);

        const submitButton = document.querySelector('#resourceForm button[type="submit"]');
        submitButton.innerHTML = '📝 Update Resource';

        // Add cancel button
        if (!document.getElementById('cancelEdit')) {
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.id = 'cancelEdit';
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.style.marginLeft = '10px';
            cancelButton.onclick = () => this.cancelEdit();
            submitButton.parentNode.appendChild(cancelButton);
        }

        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit() {
        currentEditingId = null;
        this.resetForm();

        const submitButton = document.querySelector('#resourceForm button[type="submit"]');
        submitButton.innerHTML = '📚 Add Resource';

        const cancelButton = document.getElementById('cancelEdit');
        if (cancelButton) {
            cancelButton.remove();
        }
    }
};

// Main application functions
async function loadAndDisplayResources() {
    try {
        allResources = await resourceService.getAllResources();
        filteredResources = [...allResources];
        ui.displayResources(filteredResources);
        ui.updateStats();
        ui.populateCategoryFilter();
    } catch (error) {
        console.error('Error loading resources:', error);
        utils.showMessage('Error loading resources. Please refresh the page.', 'error');
    }
}

// Edit and delete handlers
window.editResource = function (resourceId) {
    formManager.startEdit(resourceId);
};
window.deleteResource = async function (resourceId) {
    const resource = allResources.find(r => r.id === resourceId);
    if (!resource) return;
    if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) return;
    try {
        await resourceService.deleteResource(resourceId);
        utils.showMessage('Resource deleted successfully! 🗑️', 'success');
        await loadAndDisplayResources();
    } catch (error) {
        console.error('Error deleting resource:', error);
        utils.showMessage(error.message, 'error');
    }
};

// Modal functionality
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
        `<a href="${resource.externalLink}" target="_blank" class="external-link">🔗 View External Resource</a>` : '';
    modalBody.innerHTML = `
                <div class="resource-id">Resource ID: ${resource.resource_Id || 'N/A'}</div>
                ${imageHtml}
                <div class="resource-meta">
                    <span class="resource-category">${utils.escapeHtml(resource.category)}</span>
                    <span>Created: ${utils.formatDate(resource.createdAt?.seconds ? resource.createdAt.seconds * 1000 : resource.createdAt)}</span>
                    ${resource.updatedAt !== resource.createdAt ?
            `<span>Updated: ${utils.formatDate(resource.updatedAt?.seconds ? resource.updatedAt.seconds * 1000 : resource.updatedAt)}</span>` : ''}
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

// Initialize application
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Initialize all modules
        tagsManager.init();
        formManager.init();
        searchFilter.init();

        // Load and display resources
        await loadAndDisplayResources();

        console.log('health Resources Management System initialized with Firestore!');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        utils.showMessage('Failed to initialize application. Please refresh the page.', 'error');
    }
});

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById('resourceModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function (event) {
    // ESC to close modal
    if (event.key === 'Escape') {
        closeModal();
    }

    // Ctrl+K to focus search
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
    }
});
