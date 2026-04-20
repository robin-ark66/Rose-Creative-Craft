const Storage = {
    useFirebase: false,
    firebaseReady: false,
    categories: [],
    images: [],
    testimonials: [],
    sessionKey: 'rose_admin_session',
    initialized: false,

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.loadFromLocal();

        await initFirebase();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (db && storage) {
            this.useFirebase = true;
            this.firebaseReady = true;
            await this.syncFromFirebase();
        }
    },

    loadFromLocal() {
        try {
            const cats = localStorage.getItem('rose_categories');
            const imgs = localStorage.getItem('rose_images');
            const tests = localStorage.getItem('rose_testimonials');
            this.categories = cats ? JSON.parse(cats) : [];
            this.images = imgs ? JSON.parse(imgs) : [];
            this.testimonials = tests ? JSON.parse(tests) : this.getDefaultTestimonials();
        } catch (e) {
            this.categories = [];
            this.images = [];
            this.testimonials = this.getDefaultTestimonials();
        }
    },

    getDefaultTestimonials() {
        return [
            { id: 't1', text: 'Beautiful handcrafted items! Loved the wedding accessories.', author: 'Priya Sharma', rating: 5 },
            { id: 't2', text: 'Amazing quality and timely delivery. Highly recommended!', author: 'Rajesh Kumar', rating: 5 },
            { id: 't3', text: 'Great customer service and beautiful designs.', author: 'Anita Reddy', rating: 4 }
        ];
    },

    getTestimonials() {
        return this.testimonials;
    },

    addTestimonial(data) {
        const id = 't_' + Date.now();
        const testimonial = {
            id,
            text: data.text,
            author: data.author,
            rating: data.rating || 5
        };
        this.testimonials.push(testimonial);
        this.saveTestimonialsToLocal();
        return testimonial;
    },

    updateTestimonial(id, data) {
        const index = this.testimonials.findIndex(t => t.id === id);
        if (index !== -1) {
            this.testimonials[index] = { ...this.testimonials[index], ...data };
            this.saveTestimonialsToLocal();
        }
    },

    deleteTestimonial(id) {
        this.testimonials = this.testimonials.filter(t => t.id !== id);
        this.saveTestimonialsToLocal();
    },

    saveTestimonialsToLocal() {
        try {
            localStorage.setItem('rose_testimonials', JSON.stringify(this.testimonials));
        } catch (e) {
            console.error('Error saving testimonials:', e);
        }
    },

    saveToLocal() {
        try {
            localStorage.setItem('rose_categories', JSON.stringify(this.categories));
            localStorage.setItem('rose_images', JSON.stringify(this.images));
            localStorage.setItem('rose_testimonials', JSON.stringify(this.testimonials));
        } catch (e) {
            console.error('LocalStorage save failed:', e);
        }
    },

    async syncFromFirebase() {
        if (!this.useFirebase || !db) return;

        try {
            const catsSnap = await db.collection('categories').get();
            if (!catsSnap.empty) {
                this.categories = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.saveToLocal();
            }

            const imgsSnap = await db.collection('images').get();
            if (!imgsSnap.empty) {
                this.images = imgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.saveToLocal();
            }
        } catch (e) {
            console.error('Firebase sync error:', e);
        }
    },

    async refreshFromFirebase() {
        if (this.useFirebase) {
            await this.syncFromFirebase();
        }
    },

    isAuthenticated() {
        return sessionStorage.getItem(this.sessionKey) === 'true';
    },

    setSession() {
        sessionStorage.setItem(this.sessionKey, 'true');
    },

    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
    },

    getCategories() {
        return this.categories;
    },

    getCategory(id) {
        return this.categories.find(c => c.id === id);
    },

    getImages() {
        return this.images;
    },

    getImagesByCategory(categoryId) {
        return this.images.filter(img => img.categoryId === categoryId);
    },

    getImageCount(categoryId) {
        return this.images.filter(img => img.categoryId === categoryId).length;
    },

    async addCategory(data) {
        const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const category = {
            id,
            name: data.name,
            bannerImage: data.bannerImage || null,
            createdAt: Date.now()
        };

        this.categories.push(category);
        this.saveToLocal();

        if (this.useFirebase && db) {
            try {
                await db.collection('categories').doc(id).set(category);
            } catch (e) {
                console.error('Firebase category add error:', e);
            }
        }

        return category;
    },

    async updateCategory(id, data) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index === -1) return;

        this.categories[index] = { ...this.categories[index], ...data };
        this.saveToLocal();

        if (this.useFirebase && db) {
            try {
                await db.collection('categories').doc(id).update(data);
            } catch (e) {
                console.error('Firebase category update error:', e);
            }
        }
    },

    async deleteCategory(id) {
        this.categories = this.categories.filter(c => c.id !== id);
        
        const imgIds = this.images.filter(img => img.categoryId === id).map(img => img.id);
        this.images = this.images.filter(img => img.categoryId !== id);
        
        this.saveToLocal();

        if (this.useFirebase && db) {
            try {
                await db.collection('categories').doc(id).delete();
                for (const imgId of imgIds) {
                    await db.collection('images').doc(imgId).delete();
                }
            } catch (e) {
                console.error('Firebase delete error:', e);
            }
        }
    },

    async addImages(imageDataArray) {
        const results = [];

        for (const data of imageDataArray) {
            const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const imageData = {
                id,
                categoryId: data.categoryId,
                data: data.file ? await this.uploadToStorage(data.file, id) : null,
                thumbnail: data.thumbnail,
                createdAt: Date.now()
            };

            this.images.push(imageData);
            results.push(imageData);
        }

        this.saveToLocal();

        if (this.useFirebase && db) {
            for (const img of results) {
                try {
                    await db.collection('images').doc(img.id).set(img);
                } catch (e) {
                    console.error('Firebase image add error:', e);
                }
            }
        }

        return results;
    },

    async uploadToStorage(file, id) {
        if (this.useFirebase && storage) {
            try {
                const ref = storage.ref('images').child(`${id}.jpg`);
                await ref.putString(file, 'data_url');
                const url = await ref.getDownloadURL();
                return url;
            } catch (e) {
                console.error('Storage upload error:', e);
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }
        } else {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
    },

    async deleteImage(id) {
        this.images = this.images.filter(img => img.id !== id);
        this.saveToLocal();

        if (this.useFirebase && db) {
            try {
                await db.collection('images').doc(id).delete();
            } catch (e) {
                console.error('Firebase image delete error:', e);
            }
        }
    },

    clearAll() {
        this.categories = [];
        this.images = [];
        localStorage.removeItem('rose_categories');
        localStorage.removeItem('rose_images');

        if (this.useFirebase && db) {
            Promise.all([
                db.collection('categories').get().then(snap => {
                    snap.forEach(doc => doc.ref.delete());
                }),
                db.collection('images').get().then(snap => {
                    snap.forEach(doc => doc.ref.delete());
                })
            ]).catch(e => console.error('Firebase clear error:', e));
        }
    },

    getStoragePercentage() {
        const used = this.getStorageUsage();
        const limit = this.getStorageLimit();
        return (used / limit) * 100;
    },

    getStorageUsage() {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2;
            }
        }
        return total;
    },

    getStorageLimit() {
        return 5 * 1024 * 1024;
    },

    isStorageWarning() {
        return this.getStoragePercentage() > 70;
    },

    isStorageCritical() {
        return this.getStoragePercentage() > 90;
    }
};

window.Storage = Storage;
