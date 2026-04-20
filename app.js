const App = {
    initialized: false,

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            await Storage.init();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            console.error('Storage init error:', e);
        }

        this.setupNavigation();
        this.setupScrollEffects();
        this.setupContactForm();
        this.loadCategories();
        this.loadTestimonials();
        this.checkUrlHash();
        window.addEventListener('hashchange', () => this.checkUrlHash());

        this.animateHero();
    },

    animateHero() {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroContent.style.transition = 'all 0.8s ease';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 100);
        }
    },

    setupNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        const nav = document.querySelector('.nav');

        if (navToggle && navLinks) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navToggle.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target)) {
                    navToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    navToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }

        const backBtn = document.getElementById('backToCategories');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToCategories());
        }

        document.querySelectorAll('.hero-actions a').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('href');
                const element = document.querySelector(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    },

    setupScrollEffects() {
        const header = document.querySelector('.header');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.category-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `all 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });
    },

    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = form.querySelector('[name="name"]').value.trim();
            const phone = form.querySelector('[name="phone"]').value.trim();
            const email = form.querySelector('[name="email"]').value.trim();
            const message = form.querySelector('[name="message"]').value.trim();

            if (!name || !phone || !email || !message) {
                this.showToast('Please fill in all fields', 'error');
                return;
            }

            const whatsappMessage = `Hi! I'm ${name}.%0A%0APhone: ${phone}%0AEmail: ${email}%0A%0AMessage:%0A${message}`;
            const whatsappUrl = `https://wa.me/919880106696?text=${whatsappMessage}`;
            
            window.open(whatsappUrl, '_blank');
            
            this.showToast('Opening WhatsApp...', 'success');
            form.reset();
        });
    },

    loadCategories() {
        try {
            const categories = Storage.getCategories();
            const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name));
            this.renderCategories(sortedCategories);
        } catch (e) {
            console.error('Error loading categories:', e);
            this.renderCategories([]);
        }
    },

    loadTestimonials() {
        try {
            const testimonials = Storage.getTestimonials();
            this.renderTestimonials(testimonials);
        } catch (e) {
            console.error('Error loading testimonials:', e);
            this.renderTestimonials([]);
        }
    },

    renderTestimonials(testimonials) {
        const grid = document.getElementById('testimonialsGrid');
        if (!grid) return;

        if (!testimonials || testimonials.length === 0) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = testimonials.map(t => {
            const initials = t.author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);

            return `
                <div class="testimonial-card">
                    <div class="testimonial-rating">${stars}</div>
                    <p class="testimonial-text">"${t.text}"</p>
                    <div class="testimonial-author">
                        <div class="testimonial-avatar">${initials}</div>
                        <div class="testimonial-info">
                            <strong>${t.author}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderCategories(categories) {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        if (!categories || categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <h3>No Categories Yet</h3>
                    <p>Check back soon for our beautiful handcrafted collections!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = categories.map((cat, index) => {
            const imageCount = Storage.getImageCount(cat.id);
            const image = cat.bannerImage || (Storage.getImagesByCategory(cat.id)[0]?.thumbnail);

            return `
                <div class="category-card" onclick="App.viewCategory('${cat.id}')" style="animation-delay: ${index * 0.1}s">
                    <div class="category-image">
                        ${image 
                            ? `<img src="${image}" alt="${cat.name}" onerror="this.parentElement.innerHTML='<div class=\\'category-placeholder\\'>${cat.name.substring(0,2).toUpperCase()}</div>'">`
                            : `<div class="category-placeholder">${cat.name.substring(0,2).toUpperCase()}</div>`
                        }
                        <div class="category-overlay"></div>
                    </div>
                    <div class="category-content">
                        <h3 class="category-name">${cat.name}</h3>
                        <p class="category-count">${imageCount} ${imageCount === 1 ? 'image' : 'images'}</p>
                        <span class="category-btn">
                            View Gallery
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        this.setupScrollEffects();
    },

    viewCategory(categoryId) {
        const category = Storage.getCategory(categoryId);
        if (category) {
            const navToggle = document.getElementById('navToggle');
            const navLinks = document.getElementById('navLinks');
            if (navToggle) navToggle.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            
            window.location.hash = `gallery/${categoryId}`;
        }
    },

    checkUrlHash() {
        const hash = window.location.hash.slice(1);

        if (hash.startsWith('gallery/')) {
            const categoryId = hash.replace('gallery/', '');
            this.showGallery(categoryId);
        } else {
            this.showHome();
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${hash.split('/')[0]}` || (hash === '' && href === '#home')) {
                link.classList.add('active');
            }
        });
    },

    showHome() {
        const categoriesSection = document.querySelector('.categories');
        const gallerySection = document.querySelector('.gallery');
        
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (gallerySection) gallerySection.style.display = 'none';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showGallery(categoryId) {
        const category = Storage.getCategory(categoryId);
        const categoriesSection = document.querySelector('.categories');
        const gallerySection = document.querySelector('.gallery');
        
        if (!category) {
            this.showToast('Category not found', 'error');
            this.showHome();
            return;
        }

        if (categoriesSection) categoriesSection.style.display = 'none';
        if (gallerySection) gallerySection.style.display = 'block';
        
        const galleryTitle = document.getElementById('galleryTitle');
        if (galleryTitle) galleryTitle.textContent = category.name;
        
        Gallery.loadGallery(categoryId);
        
        setTimeout(() => {
            gallerySection.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    },

    backToCategories() {
        const categoriesSection = document.querySelector('.categories');
        const gallerySection = document.querySelector('.gallery');
        
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (gallerySection) gallerySection.style.display = 'none';
        
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => App.init(), 300);
});

window.App = App;
