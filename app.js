const App = {
    currentRoute: null,
    
    async init() {
        try {
            await Storage.init();
            await Storage.initializeDefaultData();
            this.setupNavigation();
            this.setupScrollEffects();
            this.setupAnimations();
            this.renderCategories();
            this.setupContactForm();
            this.handleRoute();
            
            window.addEventListener('hashchange', () => this.handleRoute());
            
            this.animateStats();
        } catch (e) {
            console.error('App initialization error:', e);
            // Fallback: initialize with localStorage only
            Storage.useFirebase = false;
            this.setupNavigation();
            this.setupScrollEffects();
            this.setupAnimations();
            this.renderCategories();
            this.setupContactForm();
            this.handleRoute();
            this.animateStats();
        }
    },
    
    setupNavigation() {
        const navToggle = document.getElementById('navToggle');
        const nav = document.getElementById('nav');
        
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        document.querySelectorAll('[data-nav="home"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navToggle.classList.remove('active');
                nav.classList.remove('active');
                this.navigateTo('');
            });
        });
        
        document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    },
    
    setupScrollEffects() {
        const header = document.getElementById('header');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    },
    
    setupAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    },
    
    animateStats() {
        const stats = document.querySelectorAll('.stat-number[data-count]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    this.animateNumber(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        stats.forEach(stat => observer.observe(stat));
    },
    
    animateNumber(element, target) {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            element.textContent = current + (element.dataset.count === '100' ? '%' : '+');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    },
    
    navigateTo(route) {
        if (route) {
            window.location.hash = '/' + route;
        } else {
            window.location.hash = '';
        }
    },
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        const parts = hash.split('/').filter(Boolean);
        
        const collectionsSection = document.getElementById('collections');
        const aboutSection = document.getElementById('about');
        const contactSection = document.getElementById('contact');
        
        document.querySelectorAll('.gallery-view').forEach(el => el.classList.remove('active'));
        
        if (parts[0] === 'gallery' && parts[1]) {
            collectionsSection.style.display = 'none';
            aboutSection.style.display = 'none';
            contactSection.style.display = 'none';
            
            const galleryView = document.getElementById('galleryView');
            if (galleryView) {
                galleryView.classList.add('active');
                Gallery.loadGallery(parts[1]);
            }
        } else if (parts[0] === 'contact') {
            collectionsSection.style.display = 'none';
            aboutSection.style.display = 'none';
            contactSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            collectionsSection.style.display = 'block';
            aboutSection.style.display = 'block';
            contactSection.style.display = 'block';
            this.scrollToTop();
        }
        
        this.currentRoute = hash;
    },
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        const emptyState = document.getElementById('emptyState');
        const categories = Storage.getCategories();
        
        console.log('Rendering categories:', categories.length);
        
        if (categories.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = categories.map((category, index) => {
            const imageCount = Storage.getImageCount(category.id);
            const initials = category.name.split(' ').map(w => w[0]).join('').substring(0, 2);
            
            return `
                <article class="category-card" data-id="${category.id}" style="animation-delay: ${index * 100}ms">
                    <div class="category-image">
                        ${category.bannerImage 
                            ? `<img src="${category.bannerImage}" alt="${category.name}" loading="lazy">`
                            : `<div class="category-placeholder">${initials}</div>`
                        }
                        <div class="category-overlay"></div>
                    </div>
                    <div class="category-content">
                        <h3 class="category-name">${category.name}</h3>
                        <p class="category-count">${imageCount} ${imageCount === 1 ? 'item' : 'items'}</p>
                        <button class="category-btn" onclick="App.navigateTo('gallery/${category.id}')">
                            View Gallery
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
        
        setTimeout(() => {
            grid.querySelectorAll('.category-card').forEach((card, i) => {
                setTimeout(() => card.classList.add('animated'), i * 100);
            });
        }, 100);
    },
    
    setupContactForm() {
        const form = document.getElementById('contactForm');
        const successMessage = document.getElementById('formSuccess');
        
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const message = form.querySelector('#message').value.trim();
            
            let isValid = true;
            
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
                group.querySelector('.form-error').textContent = '';
            });
            
            if (!name) {
                this.showFieldError('name', 'Please enter your name');
                isValid = false;
            }
            
            if (!email || !this.isValidEmail(email)) {
                this.showFieldError('email', 'Please enter a valid email');
                isValid = false;
            }
            
            if (!message) {
                this.showFieldError('message', 'Please enter your message');
                isValid = false;
            }
            
            if (!isValid) return;
            
            submitBtn.classList.add('loading');
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            submitBtn.classList.remove('loading');
            form.style.display = 'none';
            successMessage.classList.add('show');
            
            setTimeout(() => {
                successMessage.classList.remove('show');
                form.style.display = 'flex';
                form.reset();
            }, 4000);
        });
    },
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const group = field.closest('.form-group');
        const errorEl = group.querySelector('.form-error');
        
        group.classList.add('error');
        errorEl.textContent = message;
    },
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// Initialize when DOM is ready and Firebase has had time to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => App.init(), 200);
    });
} else {
    setTimeout(() => App.init(), 200);
}

window.App = App;
