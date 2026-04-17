const Storage = {
    KEYS: {
        CATEGORIES: 'craft_categories',
        IMAGES: 'craft_images',
        SESSION: 'craft_session'
    },
    useFirebase: false,
    useStorage: false,
    initialized: false,
    
    async init() {
        if (this.initialized) {
            await this.refreshFromFirebase();
            return;
        }
        
        await this.waitForFirebase();
        
        this.useFirebase = typeof firebase !== 'undefined' && firebaseReady && isFirebaseConfigured();
        this.useStorage = typeof firebase !== 'undefined' && typeof storage !== 'undefined';
        
        console.log('Firebase status - SDK:', typeof firebase !== 'undefined', 'Ready:', firebaseReady, 'Storage:', this.useStorage);
        
        if (this.useFirebase) {
            await this.syncFromFirebase();
        }
        
        this.initialized = true;
    },
    
    waitForFirebase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const check = () => {
                attempts++;
                if (firebaseReady === true || attempts > 50) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    },
    
    async refreshFromFirebase() {
        if (this.useFirebase && db) {
            await this.syncFromFirebase();
        }
    },
    
    async syncFromFirebase() {
        if (!this.useFirebase || !db) return;
        
        try {
            console.log('Syncing categories from Firebase...');
            const categoriesSnap = await db.collection('categories').get();
            const categoriesData = {};
            categoriesSnap.forEach(doc => {
                categoriesData[doc.id] = doc.data();
            });
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categoriesData));
            console.log('Synced categories:', categoriesSnap.size);
        } catch (e) {
            console.error('Sync categories error:', e);
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
        return data ? Object.values(data) : [];
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
        
        if (this.useFirebase) {
            await this.deleteFromFirebase('categories', id);
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
    
    async uploadToStorage(file, id) {
        if (!this.useStorage || !storage) {
            console.log('Firebase Storage not available, using base64');
            return null;
        }
        
        try {
            const fileName = 'images/' + id + '_' + file.name;
            const ref = storage.ref(fileName);
            await ref.put(file);
            const url = await ref.getDownloadURL();
            return url;
        } catch (e) {
            console.error('Upload to Storage error:', e);
            return null;
        }
    },
    
    async deleteFromStorage(imageUrl) {
        if (!this.useStorage || !storage || !imageUrl) return;
        
        try {
            if (imageUrl.includes('firebasestorage.app') || imageUrl.includes('googleapis.com')) {
                const ref = storage.refFromURL(imageUrl);
                await ref.delete();
            }
        } catch (e) {
            console.error('Delete from Storage error:', e);
        }
    },
    
    async addImages(imageDataArray) {
        const newImages = [];
        
        console.log('Processing', imageDataArray.length, 'images...');
        
        for (const imgData of imageDataArray) {
            const id = this.generateId();
            
            let imageUrl = imgData.data;
            let thumbnailUrl = imgData.thumbnail || imgData.data;
            
            if (this.useStorage && imgData.file) {
                console.log('Uploading image to Firebase Storage:', id);
                const url = await this.uploadToStorage(imgData.file, id);
                if (url) {
                    imageUrl = url;
                    thumbnailUrl = url;
                }
            }
            
            const newImage = {
                id: id,
                categoryId: imgData.categoryId,
                data: imageUrl,
                thumbnail: thumbnailUrl,
                createdAt: new Date().toISOString(),
                isStorageUrl: this.useStorage && imageUrl.includes('firebasestorage.app')
            };
            
            newImages.push(newImage);
            
            if (this.useFirebase) {
                await this.saveToFirebase('images', id, newImage);
            }
        }
        
        const images = this.getImages();
        images.push(...newImages);
        this.setImages(images);
        
        console.log('Saved', newImages.length, 'images to local storage');
        
        return newImages;
    },
    
    async deleteImage(id) {
        const images = this.getImages();
        const imageToDelete = images.find(img => img.id === id);
        const filtered = images.filter(img => img.id !== id);
        
        this.setImages(filtered);
        
        if (this.useFirebase) {
            await this.deleteFromFirebase('images', id);
        }
        
        if (imageToDelete && this.useStorage) {
            await this.deleteFromStorage(imageToDelete.data);
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
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            const dataUrl = canvas.toDataURL('image/jpeg', quality);
                            resolve(dataUrl);
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    async processFile(file) {
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 10MB limit');
        }
        
        return { file: file, data: null, thumbnail: null };
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
