const Gallery = {
    currentCategory: null,
    images: [],
    currentIndex: 0,
    touchStartX: 0,
    touchEndX: 0,

    loadGallery(categoryId) {
        this.currentCategory = categoryId;
        this.images = Storage.getImagesByCategory(categoryId);
        this.render();
        this.setupLightbox();
    },

    render() {
        const grid = document.getElementById('galleryGrid');

        if (this.images.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <h3>No Images Yet</h3>
                    <p>We're adding new images to this category soon!</p>
                    <button class="btn btn-primary" onclick="App.backToCategories()">
                        Browse Other Categories
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.images.map((img, index) => `
            <div class="gallery-item" onclick="Gallery.openLightbox(${index})">
                <img src="${img.thumbnail || img.data}" alt="Gallery image" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23ccc\\' stroke-width=\\'1\\'%3E%3Crect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\' ry=\\'2\\'/%3E%3Ccircle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/%3E%3Cpolyline points=\\'21 15 16 10 5 21\\'/%3E%3C/svg%3E'">
                <div class="gallery-item-overlay">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                        <path d="M11 8v6M8 11h6"/>
                    </svg>
                </div>
            </div>
        `).join('');
    },

    setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        const closeBtn = document.getElementById('lightboxClose');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        closeBtn.addEventListener('click', () => this.closeLightbox());
        prevBtn.addEventListener('click', () => this.navigate(-1));
        nextBtn.addEventListener('click', () => this.navigate(1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') this.closeLightbox();
            if (e.key === 'ArrowLeft') this.navigate(-1);
            if (e.key === 'ArrowRight') this.navigate(1);
        });

        const lightboxContent = lightbox.querySelector('.lightbox-content');
        lightboxContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        lightboxContent.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    },

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.navigate(1);
            } else {
                this.navigate(-1);
            }
        }
    },

    openLightbox(index) {
        this.currentIndex = index;
        const lightbox = document.getElementById('lightbox');
        const image = document.getElementById('lightboxImage');
        const counter = document.getElementById('lightboxCounter');

        image.src = this.images[index].data || this.images[index].thumbnail;
        counter.textContent = `${index + 1} / ${this.images.length}`;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    },

    navigate(direction) {
        this.currentIndex += direction;
        
        if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        } else if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }

        const image = document.getElementById('lightboxImage');
        const counter = document.getElementById('lightboxCounter');

        image.src = this.images[this.currentIndex].data || this.images[this.currentIndex].thumbnail;
        counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }
};

window.Gallery = Gallery;
