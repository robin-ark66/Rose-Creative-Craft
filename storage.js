const Storage = {
    KEYS: {
        CATEGORIES: 'craft_categories',
        IMAGES: 'craft_images',
        SESSION: 'craft_session'
    },
    useFirebase: false,
    
    async init() {
        // Wait for firebase-config.js to initialize
        await this.waitForFirebase();
        
        this.useFirebase = typeof firebase !== 'undefined' && firebaseReady && isFirebaseConfigured();
        console.log('Firebase status - SDK:', typeof firebase !== 'undefined', 'Ready:', firebaseReady, 'Configured:', isFirebaseConfigured(), 'Using Firebase:', this.useFirebase);
        
        if (this.useFirebase) {
            await this.syncFromFirebase();
        }
    },
    
    waitForFirebase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const check = () => {
                attempts++;
                if (firebaseReady !== undefined || attempts > 50) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    },
    
    async syncFromFirebase() {
        if (!this.useFirebase || !db) return;
        
        try {
            console.log('Syncing from Firebase...');
            const categoriesSnap = await db.collection('categories').get();
            const categoriesData = {};
            categoriesSnap.forEach(doc => {
                categoriesData[doc.id] = doc.data();
            });
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categoriesData));
            console.log('Synced categories:', categoriesSnap.size);
            
            const imagesSnap = await db.collection('images').get();
            const imagesData = {};
            imagesSnap.forEach(doc => {
                imagesData[doc.id] = doc.data();
            });
            localStorage.setItem(this.KEYS.IMAGES, JSON.stringify(imagesData));
            console.log('Synced images:', imagesSnap.size);
        } catch (e) {
            console.error('Sync error:', e);
        }
    },
    
    async saveToFirebase(collection, id, data) {
        if (!this.useFirebase) return;
        
        try {
            await db.collection(collection).doc(id).set(data);
        } catch (e) {
            console.error('Save error:', e);
        }
    },
    
    async deleteFromFirebase(collection, id) {
        if (!this.useFirebase) return;
        
        try {
            await db.collection(collection).doc(id).delete();
        } catch (e) {
            console.error('Delete error:', e);
        }
    },
    
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    getCategories() {
        const data = this.get(this.KEYS.CATEGORIES);
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return Object.values(data);
    },
    
    setCategories(categories) {
        const data = {};
        categories.forEach(cat => data[cat.id] = cat);
        const result = this.set(this.KEYS.CATEGORIES, data);
        
        if (result && this.useFirebase) {
            categories.forEach(cat => this.saveToFirebase('categories', cat.id, cat));
        }
        return result;
    },
    
    getCategory(id) {
        const data = this.get(this.KEYS.CATEGORIES);
        return data ? data[id] : null;
    },
    
    async addCategory(category) {
        const categories = this.getCategories();
        const newCategory = {
            id: this.generateId(),
            name: category.name,
            bannerImage: category.bannerImage || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        categories.push(newCategory);
        
        const data = {};
        categories.forEach(cat => data[cat.id] = cat);
        this.set(this.KEYS.CATEGORIES, data);
        
        if (this.useFirebase) {
            await this.saveToFirebase('categories', newCategory.id, newCategory);
        }
        
        return newCategory;
    },
    
    async updateCategory(id, updates) {
        const data = this.get(this.KEYS.CATEGORIES);
        if (data && data[id]) {
            data[id] = {
                ...data[id],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.set(this.KEYS.CATEGORIES, data);
            
            if (this.useFirebase) {
                await this.saveToFirebase('categories', id, data[id]);
            }
            return data[id];
        }
        return null;
    },
    
    async deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        
        const data = {};
        filtered.forEach(cat => data[cat.id] = cat);
        this.set(this.KEYS.CATEGORIES, data);
        
        const images = this.getImages();
        const filteredImages = images.filter(img => img.categoryId !== id);
        const imagesData = {};
        filteredImages.forEach(img => imagesData[img.id] = img);
        this.set(this.KEYS.IMAGES, imagesData);
        
        if (this.useFirebase) {
            await this.deleteFromFirebase('categories', id);
            const allImages = await db.collection('images').where('categoryId', '==', id).get();
            allImages.forEach(doc => doc.ref.delete());
        }
        return true;
    },
    
    getImages(categoryId = null) {
        const data = this.get(this.KEYS.IMAGES);
        let images = [];
        if (!data) return [];
        if (Array.isArray(data)) {
            images = data;
        } else {
            images = Object.values(data);
        }
        if (categoryId) {
            images = images.filter(img => img.categoryId === categoryId);
        }
        return images;
    },
    
    setImages(images) {
        const data = {};
        images.forEach(img => data[img.id] = img);
        return this.set(this.KEYS.IMAGES, data);
    },
    
    async addImage(imageData) {
        const images = this.getImages();
        const newImage = {
            id: this.generateId(),
            categoryId: imageData.categoryId,
            data: imageData.data,
            thumbnail: imageData.thumbnail || imageData.data,
            createdAt: new Date().toISOString()
        };
        images.push(newImage);
        
        const data = {};
        images.forEach(img => data[img.id] = img);
        this.set(this.KEYS.IMAGES, data);
        
        if (this.useFirebase) {
            await this.saveToFirebase('images', newImage.id, newImage);
        }
        
        return newImage;
    },
    
    async addImages(imageDataArray) {
        const images = this.getImages();
        const newImages = imageDataArray.map(data => ({
            id: this.generateId(),
            categoryId: data.categoryId,
            data: data.data,
            thumbnail: data.thumbnail || data.data,
            createdAt: new Date().toISOString()
        }));
        images.push(...newImages);
        
        const data = {};
        images.forEach(img => data[img.id] = img);
        this.set(this.KEYS.IMAGES, data);
        
        console.log('Saving', newImages.length, 'images to Firebase:', this.useFirebase);
        
        if (this.useFirebase) {
            for (const img of newImages) {
                console.log('Saving image to Firebase:', img.id);
                await this.saveToFirebase('images', img.id, img);
            }
            console.log('All images saved to Firebase');
        }
        
        return newImages;
    },
    
    async deleteImage(id) {
        const images = this.getImages();
        const filtered = images.filter(img => img.id !== id);
        
        const data = {};
        filtered.forEach(img => data[img.id] = img);
        this.set(this.KEYS.IMAGES, data);
        
        if (this.useFirebase) {
            await this.deleteFromFirebase('images', id);
        }
        return true;
    },
    
    getImageCount(categoryId) {
        const images = this.getImages();
        return images.filter(img => img.categoryId === categoryId).length;
    },
    
    getSession() {
        const session = this.get(this.KEYS.SESSION);
        if (session && session.expiresAt) {
            if (new Date(session.expiresAt) > new Date()) {
                return session;
            }
            this.clearSession();
            return null;
        }
        return null;
    },
    
    setSession(password = 'craft2024') {
        const session = {
            loggedIn: true,
            password: password,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        return this.set(this.KEYS.SESSION, session);
    },
    
    clearSession() {
        return this.remove(this.KEYS.SESSION);
    },
    
    isAuthenticated() {
        return this.getSession() !== null;
    },
    
    async initializeDefaultData() {
        const categories = this.getCategories();
        
        if (categories.length === 0) {
            const defaultCategories = [
                {
                    name: 'Wedding Accessories',
                    bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'
                },
                {
                    name: 'Holiday Decorations',
                    bannerImage: 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=800&h=600&fit=crop'
                },
                {
                    name: 'Decorative Vases',
                    bannerImage: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop'
                },
                {
                    name: 'Woolen Items',
                    bannerImage: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&h=600&fit=crop'
                }
            ];
            
            for (const cat of defaultCategories) {
                await this.addCategory(cat);
            }
        }
    },
    
    clearAll() {
        this.remove(this.KEYS.CATEGORIES);
        this.remove(this.KEYS.IMAGES);
        this.remove(this.KEYS.SESSION);
        
        if (this.useFirebase) {
            db.collection('categories').get().then(snap => {
                snap.forEach(doc => doc.ref.delete());
            });
            db.collection('images').get().then(snap => {
                snap.forEach(doc => doc.ref.delete());
            });
        }
    },
    
    getStorageUsage() {
        let total = 0;
        const categories = localStorage.getItem(this.KEYS.CATEGORIES);
        const images = localStorage.getItem(this.KEYS.IMAGES);
        
        if (categories) total += categories.length * 2;
        if (images) total += images.length * 2;
        
        return total;
    },
    
    getStorageLimit() {
        return 5 * 1024 * 1024;
    },
    
    getStoragePercentage() {
        return (this.getStorageUsage() / this.getStorageLimit() * 100).toFixed(1);
    },
    
    isStorageWarning() {
        return this.getStoragePercentage() > 80;
    },
    
    isStorageCritical() {
        return this.getStoragePercentage() > 95;
    }
};

const ImageUtils = {
    MAX_DIMENSION: 1920,
    THUMBNAIL_DIMENSION: 400,
    QUALITY: 0.85,
    
    async compressImage(file, maxDimension = this.MAX_DIMENSION, quality = this.QUALITY) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    async createThumbnail(file) {
        return this.compressImage(file, this.THUMBNAIL_DIMENSION, 0.7);
    },
    
    async processFile(file) {
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 10MB limit');
        }
        
        const data = await this.compressImage(file);
        const thumbnail = await this.createThumbnail(file);
        
        return { data, thumbnail };
    },
    
    async processFiles(files) {
        const results = [];
        for (const file of files) {
            try {
                const processed = await this.processFile(file);
                results.push(processed);
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
            }
        }
        return results;
    },
    
    getFileFromDataUrl(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    },
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

window.Storage = Storage;
window.ImageUtils = ImageUtils;
