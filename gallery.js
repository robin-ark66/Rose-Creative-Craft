const Gallery = {
    currentCategoryId: null,
    currentImages: [],
    currentIndex: 0,
    touchStartX: 0,
    touchEndX: 0,
    
    init() {
        this.createGalleryView();
        this.setupLightbox();
    },
    
    createGalleryView() {
        const main = document.getElementById('main');
        const galleryView = document.createElement('div');
        galleryView.id = 'galleryView';
        galleryView.className = 'gallery-view';
        galleryView.innerHTML = `
            <div class="gallery-header">
                <div class="container">
                    <a href="#" class="gallery-back" onclick="Gallery.goBack(event)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Collections
                    </a>
                    <h1 class="gallery-title" id="galleryTitle">Gallery</h1>
                </div>
            </div>
            <div class="container">
                <div class="gallery-grid" id="galleryGrid"></div>
                <div class="empty-gallery" id="emptyGallery" style="display: none;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <h3>No Images Yet</h3>
                    <p>Add images to this collection from the admin dashboard</p>
                </div>
            </div>
        `;
        main.appendChild(galleryView);
    },
    
    loadGallery(categoryId) {
        this.currentCategoryId = categoryId;
        const category = Storage.getCategory(categoryId);
        
        if (!category) {
            App.showToast('Category not found', 'error');
            this.goBack();
            return;
        }
        
        document.getElementById('galleryTitle').textContent = category.name;
        
        this.currentImages = Storage.getImages(categoryId);
        this.renderGallery();
        
        setTimeout(() => {
            const galleryHeader = document.querySelector('.gallery-header');
            if (galleryHeader) {
                galleryHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    },
    
    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        const emptyGallery = document.getElementById('emptyGallery');
        
        if (this.currentImages.length === 0) {
            grid.innerHTML = '';
            emptyGallery.style.display = 'block';
            return;
        }
        
        emptyGallery.style.display = 'none';
        
        grid.innerHTML = this.currentImages.map((image, index) => `
            <div class="gallery-item" data-index="${index}" onclick="Gallery.openLightbox(${index})">
                <img src="${image.thumbnail || image.data}" alt="Gallery image ${index + 1}" loading="lazy">
                <div class="gallery-item-overlay">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                        <path d="M11 8v6M8 11h6"/>
                    </svg>
                </div>
            </div>
        `).join('');
    },
    
    goBack(e) {
        if (e) e.preventDefault();
        App.navigateTo('');
    },
    
    setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        const image = lightbox.querySelector('.lightbox-image');
        
        closeBtn.addEventListener('click', () => this.closeLightbox());
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateLightbox(-1);
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateLightbox(1);
        });
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.navigateLightbox(-1);
                    break;
                case 'ArrowRight':
                    this.navigateLightbox(1);
                    break;
            }
        });
        
        lightbox.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        lightbox.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    },
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.navigateLightbox(1);
            } else {
                this.navigateLightbox(-1);
            }
        }
    },
    
    openLightbox(index) {
        this.currentIndex = index;
        const lightbox = document.getElementById('lightbox');
        const image = lightbox.querySelector('.lightbox-image');
        
        image.src = this.currentImages[index].data;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    },
    
    navigateLightbox(direction) {
        const total = this.currentImages.length;
        this.currentIndex = (this.currentIndex + direction + total) % total;
        
        const lightbox = document.getElementById('lightbox');
        const image = lightbox.querySelector('.lightbox-image');
        
        image.style.opacity = '0';
        setTimeout(() => {
            image.src = this.currentImages[this.currentIndex].data;
            image.style.opacity = '1';
        }, 150);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Gallery.init();
});

window.Gallery = Gallery;
