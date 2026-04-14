const Admin = {
    currentPage: 'dashboard',
    editingCategoryId: null,
    uploadCategoryId: null,
    pendingImages: [],
    deleteCallback: null,
    
    async init() {
        try {
            await Storage.init();
        } catch (e) {
            console.error('Storage init error:', e);
            Storage.useFirebase = false;
        }
        this.checkAuth();
        this.setupEventListeners();
    },
    
    checkAuth() {
        if (Storage.isAuthenticated()) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    },
    
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminWrapper').style.display = 'none';
    },
    
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminWrapper').style.display = 'flex';
        this.renderCurrentPage();
    },
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => this.logout());
        
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });
        
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        addCategoryBtn.addEventListener('click', () => this.openCategoryModal());
        
        const categoryForm = document.getElementById('categoryForm');
        categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        
        this.setupBannerUpload();
        this.setupMultiUpload();
        
        document.getElementById('confirmUpload').addEventListener('click', () => this.executeUpload());
        
        document.getElementById('confirmDelete').addEventListener('click', () => this.executeDelete());
        
        document.getElementById('imageCategoryFilter').addEventListener('change', (e) => {
            this.renderImages(e.target.value);
        });
    },
    
    handleLogin(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');
        
        if (password === 'craft2024') {
            Storage.setSession();
            errorEl.textContent = '';
            this.showDashboard();
        } else {
            errorEl.textContent = 'Incorrect password';
            document.getElementById('password').value = '';
        }
    },
    
    logout() {
        Storage.clearSession();
        this.showLogin();
    },
    
    navigateTo(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        const titles = {
            dashboard: 'Dashboard',
            categories: 'Categories',
            images: 'All Images'
        };
        document.getElementById('pageTitle').textContent = titles[page];
        
        const addBtn = document.getElementById('addCategoryBtn');
        addBtn.style.display = page === 'categories' ? 'flex' : 'none';
        
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById(page + 'Page').style.display = 'block';
        
        this.renderCurrentPage();
    },
    
    renderCurrentPage() {
        switch (this.currentPage) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'images':
                this.renderImages();
                this.populateCategoryFilter();
                break;
        }
    },
    
    renderDashboard() {
        const categories = Storage.getCategories();
        const images = Storage.getImages();
        
        document.getElementById('totalCategories').textContent = categories.length;
        document.getElementById('totalImages').textContent = images.length;
        
        this.updateStorageIndicator();
        
        const recentList = document.getElementById('recentCategories');
        
        if (categories.length === 0) {
            recentList.innerHTML = '<p class="empty-text">No categories yet. Create your first one!</p>';
            return;
        }
        
        recentList.innerHTML = categories.slice(-3).reverse().map(cat => {
            const imageCount = Storage.getImageCount(cat.id);
            const initials = cat.name.split(' ').map(w => w[0]).join('').substring(0, 2);
            
            return `
                <div class="category-list-item">
                    ${cat.bannerImage 
                        ? `<img src="${cat.bannerImage}" alt="${cat.name}">`
                        : `<div class="category-placeholder" style="width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--color-surface-alt);font-family:var(--font-heading);font-size:1.25rem;font-weight:600;color:var(--color-accent);">${initials}</div>`
                    }
                    <div class="category-list-info">
                        <span class="category-list-name">${cat.name}</span>
                        <span class="category-list-count">${imageCount} ${imageCount === 1 ? 'image' : 'images'}</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    renderCategories() {
        const grid = document.getElementById('categoriesAdminGrid');
        const emptyState = document.getElementById('emptyCategories');
        const categories = Storage.getCategories();
        
        if (categories.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = categories.map(cat => {
            const imageCount = Storage.getImageCount(cat.id);
            const initials = cat.name.split(' ').map(w => w[0]).join('').substring(0, 2);
            
            return `
                <div class="category-admin-card">
                    <div class="category-admin-image">
                        ${cat.bannerImage 
                            ? `<img src="${cat.bannerImage}" alt="${cat.name}">`
                            : `<div class="category-admin-placeholder">${initials}</div>`
                        }
                    </div>
                    <div class="category-admin-content">
                        <h3 class="category-admin-name">${cat.name}</h3>
                        <p class="category-admin-count">${imageCount} ${imageCount === 1 ? 'image' : 'images'}</p>
                        <div class="category-admin-actions">
                            <button class="btn btn-upload" onclick="Admin.openUploadModal('${cat.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Upload
                            </button>
                            <button class="btn btn-secondary" onclick="Admin.editCategory('${cat.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Edit
                            </button>
                            <button class="btn btn-danger" onclick="Admin.deleteCategory('${cat.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    renderImages(categoryId = '') {
        const grid = document.getElementById('imagesAdminGrid');
        const emptyState = document.getElementById('emptyImages');
        
        let images = Storage.getImages();
        if (categoryId) {
            images = images.filter(img => img.categoryId === categoryId);
        }
        
        if (images.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        grid.innerHTML = images.map(img => {
            const category = Storage.getCategory(img.categoryId);
            
            return `
                <div class="image-admin-item" data-id="${img.id}">
                    <img src="${img.thumbnail || img.data}" alt="Image">
                    ${category ? `<span class="image-category-badge">${category.name}</span>` : ''}
                    <div class="image-admin-overlay">
                        <button class="image-admin-btn set-banner" onclick="event.stopPropagation(); Admin.setAsBanner('${img.id}')" title="Set as banner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        </button>
                        <button class="image-admin-btn" onclick="event.stopPropagation(); Admin.deleteImage('${img.id}')" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    populateCategoryFilter() {
        const select = document.getElementById('imageCategoryFilter');
        const categories = Storage.getCategories();
        
        select.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    },
    
    openCategoryModal(categoryId = null) {
        this.editingCategoryId = categoryId;
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');
        const form = document.getElementById('categoryForm');
        const preview = document.getElementById('bannerPreview');
        
        form.reset();
        preview.style.display = 'none';
        preview.innerHTML = '';
        
        if (categoryId) {
            const category = Storage.getCategory(categoryId);
            title.textContent = 'Edit Category';
            document.getElementById('categoryId').value = categoryId;
            document.getElementById('categoryName').value = category.name;
            
            if (category.bannerImage) {
                preview.innerHTML = `<img src="${category.bannerImage}" alt="Banner preview">`;
                preview.style.display = 'grid';
            }
        } else {
            title.textContent = 'Add Category';
            document.getElementById('categoryId').value = '';
        }
        
        modal.classList.add('active');
    },
    
    editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    },
    
    setupBannerUpload() {
        const zone = document.getElementById('bannerUpload');
        const input = document.getElementById('bannerInput');
        const preview = document.getElementById('bannerPreview');
        
        zone.addEventListener('click', () => input.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await this.processBannerFile(file);
            }
        });
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.processBannerFile(file);
            }
        });
    },
    
    async processBannerFile(file) {
        const preview = document.getElementById('bannerPreview');
        const zone = document.getElementById('bannerUpload');
        
        try {
            const processed = await ImageUtils.processFile(file);
            
            zone.dataset.imageData = processed.data;
            preview.innerHTML = `<img src="${processed.data}" alt="Banner preview">`;
            preview.style.display = 'grid';
        } catch (error) {
            this.showToast('Error processing image: ' + error.message, 'error');
        }
    },
    
    handleCategorySubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value.trim();
        const bannerZone = document.getElementById('bannerUpload');
        const bannerImage = bannerZone.dataset.imageData || null;
        const categoryId = document.getElementById('categoryId').value;
        
        if (!name) {
            this.showToast('Please enter a category name', 'error');
            return;
        }
        
        if (categoryId) {
            Storage.updateCategory(categoryId, { name, bannerImage });
            this.showToast('Category updated successfully', 'success');
        } else {
            Storage.addCategory({ name, bannerImage });
            this.showToast('Category created successfully', 'success');
        }
        
        this.closeModal('categoryModal');
        this.renderCategories();
        this.renderDashboard();
    },
    
    deleteCategory(categoryId) {
        const category = Storage.getCategory(categoryId);
        document.getElementById('deleteMessage').textContent = 
            `Are you sure you want to delete "${category.name}"? This will also delete all images in this category.`;
        
        this.deleteCallback = () => {
            Storage.deleteCategory(categoryId);
            this.showToast('Category deleted successfully', 'success');
            this.renderCategories();
            this.renderDashboard();
        };
        
        this.openModal('deleteModal');
    },
    
    openUploadModal(categoryId) {
        this.uploadCategoryId = categoryId;
        const category = Storage.getCategory(categoryId);
        
        document.getElementById('uploadCategoryName').textContent = category.name;
        document.getElementById('uploadPreviewGrid').innerHTML = '';
        document.getElementById('confirmUpload').disabled = true;
        document.getElementById('uploadProgress').style.display = 'none';
        this.pendingImages = [];
        
        this.openModal('uploadModal');
    },
    
    setupMultiUpload() {
        const zone = document.getElementById('multiUploadZone');
        const input = document.getElementById('multiUploadInput');
        
        zone.addEventListener('click', () => input.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                await this.addImagesToUpload(files);
            }
        });
        
        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await this.addImagesToUpload(files);
            }
            input.value = '';
        });
    },
    
    async addImagesToUpload(files) {
        const previewGrid = document.getElementById('uploadPreviewGrid');
        
        for (const file of files) {
            try {
                const processed = await ImageUtils.processFile(file);
                const id = 'temp_' + Date.now() + '_' + Math.random();
                
                this.pendingImages.push({
                    id,
                    file,
                    data: processed.data,
                    thumbnail: processed.thumbnail
                });
                
                const item = document.createElement('div');
                item.className = 'upload-preview-item';
                item.dataset.id = id;
                item.innerHTML = `
                    <img src="${processed.thumbnail}" alt="Preview">
                    <button class="remove-btn" onclick="Admin.removePendingImage('${id}')">&times;</button>
                `;
                previewGrid.appendChild(item);
            } catch (error) {
                console.error('Error processing file:', error);
            }
        }
        
        document.getElementById('confirmUpload').disabled = this.pendingImages.length === 0;
    },
    
    removePendingImage(id) {
        this.pendingImages = this.pendingImages.filter(img => img.id !== id);
        
        const item = document.querySelector(`.upload-preview-item[data-id="${id}"]`);
        if (item) {
            item.remove();
        }
        
        document.getElementById('confirmUpload').disabled = this.pendingImages.length === 0;
    },
    
    async executeUpload() {
        if (this.pendingImages.length === 0) return;
        
        if (Storage.isStorageCritical()) {
            this.showToast('Storage is full! Delete some images before uploading.', 'error');
            return;
        }
        
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const confirmBtn = document.getElementById('confirmUpload');
        
        progressContainer.style.display = 'block';
        confirmBtn.disabled = true;
        
        const imageDataArray = this.pendingImages.map(img => ({
            categoryId: this.uploadCategoryId,
            data: img.data,
            thumbnail: img.thumbnail
        }));
        
        const success = Storage.addImages(imageDataArray);
        
        if (!success) {
            this.showToast('Storage full! Upload failed.', 'error');
            this.closeModal('uploadModal');
            return;
        }
        
        for (let i = 0; i <= 100; i += 10) {
            progressFill.style.width = i + '%';
            progressText.textContent = `Uploading... ${i}%`;
            await new Promise(r => setTimeout(r, 100));
        }
        
        this.showToast(`${this.pendingImages.length} images uploaded successfully`, 'success');
        
        this.closeModal('uploadModal');
        this.renderCategories();
        this.renderDashboard();
    },
    
    deleteImage(imageId) {
        document.getElementById('deleteMessage').textContent = 'Are you sure you want to delete this image?';
        
        this.deleteCallback = () => {
            Storage.deleteImage(imageId);
            this.showToast('Image deleted successfully', 'success');
            this.renderImages(document.getElementById('imageCategoryFilter').value);
            this.renderCategories();
        };
        
        this.openModal('deleteModal');
    },
    
    confirmClearImages() {
        const imageCount = Storage.getImages().length;
        if (imageCount === 0) {
            this.showToast('No images to clear', 'info');
            return;
        }
        
        document.getElementById('deleteMessage').textContent = 
            `Are you sure you want to delete all ${imageCount} images? This action cannot be undone.`;
        
        this.deleteCallback = () => {
            const images = Storage.getImages();
            images.forEach(img => Storage.deleteImage(img.id));
            this.showToast('All images deleted', 'success');
            this.renderDashboard();
            this.renderCategories();
            this.renderImages();
        };
        
        this.openModal('deleteModal');
    },
    
    confirmResetAll() {
        document.getElementById('deleteMessage').innerHTML = 
            '<strong style="color: var(--color-error);">Warning!</strong> This will delete ALL categories, images, and reset the site to default. This cannot be undone!';
        
        this.deleteCallback = () => {
            Storage.clearAll();
            Storage.initializeDefaultData();
            this.showToast('All data has been reset', 'success');
            this.renderDashboard();
            this.renderCategories();
            this.renderImages();
        };
        
        this.openModal('deleteModal');
    },
    
    setAsBanner(imageId) {
        const image = Storage.getImages().find(img => img.id === imageId);
        if (image) {
            Storage.updateCategory(image.categoryId, { bannerImage: image.data });
            this.showToast('Banner image updated', 'success');
            this.renderCategories();
        }
    },
    
    executeDelete() {
        if (this.deleteCallback) {
            this.deleteCallback();
            this.deleteCallback = null;
        }
        this.closeModal('deleteModal');
    },
    
    openModal(id) {
        document.getElementById(id).classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    closeModal(id) {
        document.getElementById(id).classList.remove('active');
        document.body.style.overflow = '';
    },
    
    updateStorageIndicator() {
        const percentage = parseFloat(Storage.getStoragePercentage());
        const used = Storage.getStorageUsage();
        const limit = Storage.getStorageLimit();
        
        document.getElementById('storageUsed').textContent = percentage.toFixed(1) + '%';
        document.getElementById('storageBarFill').style.width = Math.min(percentage, 100) + '%';
        document.getElementById('storageInfo').textContent = 
            `${ImageUtils.formatFileSize(used)} of ${ImageUtils.formatFileSize(limit)} used`;
        
        const barFill = document.getElementById('storageBarFill');
        const container = document.getElementById('storageBarContainer');
        const storageIcon = document.querySelector('.storage-icon');
        
        barFill.classList.remove('warning', 'critical');
        container.classList.remove('warning', 'critical');
        storageIcon.classList.remove('warning', 'critical');
        
        if (Storage.isStorageCritical()) {
            barFill.classList.add('critical');
            container.classList.add('critical');
            storageIcon.classList.add('critical');
            document.getElementById('storageInfo').innerHTML = 
                '<strong style="color: var(--color-error);">Storage almost full!</strong> Delete some images or clear old data.';
        } else if (Storage.isStorageWarning()) {
            barFill.classList.add('warning');
            container.classList.add('warning');
            storageIcon.classList.add('warning');
            document.getElementById('storageInfo').innerHTML = 
                '<strong style="color: #E6A23C;">Storage running low.</strong> Consider deleting unused images.';
        }
    },
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${type === 'success' 
                    ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                    : type === 'error'
                    ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                    : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
                }
            </svg>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Admin.init();
});

window.Admin = Admin;
