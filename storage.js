const Storage = {
    KEYS: {
        CATEGORIES: 'craft_categories',
        IMAGES: 'craft_images',
        SESSION: 'craft_session'
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
            if (e.name === 'QuotaExceededError') {
                this.showQuotaWarning();
            }
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
    
    showQuotaWarning() {
        console.warn('LocalStorage quota exceeded. Consider clearing old data.');
    },
    
    getCategories() {
        return this.get(this.KEYS.CATEGORIES) || [];
    },
    
    setCategories(categories) {
        return this.set(this.KEYS.CATEGORIES, categories);
    },
    
    getCategory(id) {
        const categories = this.getCategories();
        return categories.find(c => c.id === id);
    },
    
    addCategory(category) {
        const categories = this.getCategories();
        const newCategory = {
            id: this.generateId(),
            name: category.name,
            bannerImage: category.bannerImage || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        categories.push(newCategory);
        this.setCategories(categories);
        return newCategory;
    },
    
    updateCategory(id, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.setCategories(categories);
            return categories[index];
        }
        return null;
    },
    
    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        this.setCategories(filtered);
        const images = this.getImages();
        const filteredImages = images.filter(img => img.categoryId !== id);
        this.setImages(filteredImages);
        return true;
    },
    
    getImages(categoryId = null) {
        const images = this.get(this.KEYS.IMAGES) || [];
        if (categoryId) {
            return images.filter(img => img.categoryId === categoryId);
        }
        return images;
    },
    
    setImages(images) {
        return this.set(this.KEYS.IMAGES, images);
    },
    
    addImage(imageData) {
        const images = this.getImages();
        const newImage = {
            id: this.generateId(),
            categoryId: imageData.categoryId,
            data: imageData.data,
            thumbnail: imageData.thumbnail || imageData.data,
            createdAt: new Date().toISOString()
        };
        images.push(newImage);
        return this.setImages(images) ? newImage : false;
    },
    
    addImages(imageDataArray) {
        const images = this.getImages();
        const newImages = imageDataArray.map(data => ({
            id: this.generateId(),
            categoryId: data.categoryId,
            data: data.data,
            thumbnail: data.thumbnail || data.data,
            createdAt: new Date().toISOString()
        }));
        images.push(...newImages);
        return this.setImages(images) ? newImages : false;
    },
    
    deleteImage(id) {
        const images = this.getImages();
        const filtered = images.filter(img => img.id !== id);
        this.setImages(filtered);
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
    
    initializeDefaultData() {
        if (this.getCategories().length === 0) {
            const defaultCategories = [
                {
                    name: 'Handwoven Baskets',
                    bannerImage: 'https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=800&h=600&fit=crop',
                    colors: ['#D4A574', '#8B7355']
                },
                {
                    name: 'Ceramic Planters',
                    bannerImage: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=600&fit=crop',
                    colors: ['#A67B52', '#6B5B4F']
                },
                {
                    name: 'Macramé Wall Art',
                    bannerImage: 'https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&h=600&fit=crop',
                    colors: ['#C4956A', '#E8D5C4']
                },
                {
                    name: 'Wooden Home Decor',
                    bannerImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
                    colors: ['#8B6914', '#D4B896']
                }
            ];
            
            defaultCategories.forEach(cat => {
                this.addCategory(cat);
            });
        }
    },
    
    clearAll() {
        this.remove(this.KEYS.CATEGORIES);
        this.remove(this.KEYS.IMAGES);
        this.remove(this.KEYS.SESSION);
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
