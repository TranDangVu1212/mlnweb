/**
 * Dịch Vụ Công Việt Nam - Frontend Application
 * Main JavaScript module for handling all interactions
 */

const API_BASE = window.location.origin;

// ============ UTILITY FUNCTIONS ============

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đã xảy ra lỗi');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Format date to Vietnamese locale
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
}

/**
 * Format number with thousand separators
 */
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Debounce function for search
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-vietred' : 'bg-accent';
    
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-4 rounded-formal shadow-formal-card z-50 transform translate-y-full transition-transform duration-300`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${type === 'success' 
                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-full');
    });
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-full');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Get service status badge HTML
 */
function getStatusBadge(status) {
    const statusMap = {
        'online': { text: 'Trực tuyến', class: 'bg-success/10 text-success border border-success/30' },
        'partial': { text: 'Một phần', class: 'bg-gold/10 text-gold border border-gold/30' },
        'offline': { text: 'Trực tiếp', class: 'bg-steel/10 text-steel border border-steel/30' }
    };
    const statusInfo = statusMap[status] || statusMap['offline'];
    return `<span class="text-xs ${statusInfo.class} font-medium px-3 py-1 rounded-formal">${statusInfo.text}</span>`;
}

/**
 * Get service level text
 */
function getLevelText(level) {
    const levels = {
        1: 'Mức độ 1 - Thông tin',
        2: 'Mức độ 2 - Tải biểu mẫu',
        3: 'Mức độ 3 - Nộp hồ sơ trực tuyến',
        4: 'Mức độ 4 - Hoàn toàn trực tuyến'
    };
    return levels[level] || 'Không xác định';
}

// ============ SERVICE CARD COMPONENT ============

/**
 * Create service card HTML
 */
function createServiceCard(service, colorClass = 'accent') {
    const colors = ['accent', 'vietred', 'success', 'navy', 'steel'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `
        <a href="/dich-vu/${service.id}" class="block bg-white rounded-formal-lg p-6 shadow-formal border border-border hover:shadow-formal-lg transition-all cursor-pointer group gov-card">
            <div class="w-14 h-14 bg-${color}/10 rounded-formal flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
            </div>
            <h3 class="font-heading text-lg font-semibold text-primary mb-2">${service.name}</h3>
            <p class="text-muted text-sm mb-4 line-clamp-2">${service.shortDescription}</p>
            <div class="flex items-center justify-between">
                ${getStatusBadge(service.status)}
                <svg class="w-5 h-5 text-steel group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </a>
    `;
}

// ============ MAIN APPLICATION ============

class DichVuCongApp {
    constructor() {
        this.init();
    }

    async init() {
        // Load initial data
        await this.loadStatistics();
        await this.loadPopularServices();
        
        // Setup event listeners
        this.setupContactForm();
        this.setupSearch();
        this.setupMobileMenu();
        this.setupTrackingForm();
        this.setupSmoothScroll();
    }

    /**
     * Load statistics from API
     */
    async loadStatistics() {
        try {
            const response = await apiRequest('/api/statistics');
            if (response.success) {
                this.updateStatistics(response.data);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    /**
     * Update statistics in UI
     */
    updateStatistics(stats) {
        const statsContainer = document.querySelector('[data-stats]');
        if (statsContainer) {
            const elements = statsContainer.querySelectorAll('[data-stat]');
            elements.forEach(el => {
                const stat = el.dataset.stat;
                if (stats[stat]) {
                    el.textContent = formatNumber(stats[stat]);
                }
            });
        }
    }

    /**
     * Load popular services
     */
    async loadPopularServices() {
        try {
            const response = await apiRequest('/api/services/popular?limit=6');
            if (response.success && response.data.length > 0) {
                this.renderServices(response.data);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    /**
     * Render services to the grid
     */
    renderServices(services) {
        const container = document.getElementById('services-grid');
        if (!container) return;

        const colors = ['accent', 'vietred', 'success', 'navy', 'steel'];
        
        container.innerHTML = services.map((service, index) => {
            const color = colors[index % colors.length];
            return `
                <div onclick="window.location.href='/dich-vu/${service.id}'" class="bg-white rounded-formal-lg p-6 shadow-formal border border-border hover:shadow-formal-lg transition-all cursor-pointer group gov-card">
                    <div class="w-14 h-14 bg-${color}/10 rounded-formal flex items-center justify-center mb-4">
                        <svg class="w-7 h-7 text-${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <h3 class="font-heading text-lg font-semibold text-primary mb-2">${service.name}</h3>
                    <p class="text-muted text-sm mb-4 line-clamp-2">${service.shortDescription}</p>
                    <div class="flex items-center justify-between">
                        ${getStatusBadge(service.status)}
                        <div class="flex items-center gap-2 text-sm text-muted">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            ${formatNumber(service.views)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Setup contact form submission
     */
    setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Đang gửi...
            `;

            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                const response = await apiRequest('/api/contact', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });

                if (response.success) {
                    showToast(`${response.message} Mã theo dõi: ${response.data.ticketId}`, 'success');
                    form.reset();
                }
            } catch (error) {
                showToast(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    /**
     * Setup search functionality
     */
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput) return;

        const performSearch = debounce(async (query) => {
            if (query.length < 2) {
                if (searchResults) searchResults.classList.add('hidden');
                return;
            }

            try {
                const response = await apiRequest(`/api/search?q=${encodeURIComponent(query)}`);
                if (response.success) {
                    this.renderSearchResults(response.data, searchResults);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        // Close search results on click outside
        document.addEventListener('click', (e) => {
            if (searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    }

    /**
     * Render search results
     */
    renderSearchResults(data, container) {
        if (!container) return;
        
        const { services, categories } = data;
        
        if (services.length === 0 && categories.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-muted">
                    <p>Không tìm thấy kết quả</p>
                </div>
            `;
        } else {
            let html = '';
            
            if (categories.length > 0) {
                html += `<div class="p-2 text-xs font-semibold text-muted uppercase">Danh mục</div>`;
                categories.forEach(cat => {
                    html += `
                        <a href="/danh-muc/${cat.id}" class="block px-4 py-2 hover:bg-accent/10 cursor-pointer">
                            <span class="font-medium text-text">${cat.name}</span>
                        </a>
                    `;
                });
            }
            
            if (services.length > 0) {
                html += `<div class="p-2 text-xs font-semibold text-muted uppercase border-t border-border">Dịch vụ</div>`;
                services.forEach(service => {
                    html += `
                        <a href="/dich-vu/${service.id}" class="block px-4 py-2 hover:bg-accent/10 cursor-pointer">
                            <span class="font-medium text-text">${service.name}</span>
                            <span class="block text-sm text-muted truncate">${service.shortDescription}</span>
                        </a>
                    `;
                });
            }
            
            container.innerHTML = html;
        }
        
        container.classList.remove('hidden');
    }

    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    /**
     * Setup tracking form
     */
    setupTrackingForm() {
        const trackingForm = document.getElementById('tracking-form');
        const trackingInput = document.getElementById('tracking-input');
        const trackingResult = document.getElementById('tracking-result');

        if (!trackingForm) return;

        trackingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const code = trackingInput.value.trim().toUpperCase();
            if (!code) {
                showToast('Vui lòng nhập mã hồ sơ', 'error');
                return;
            }

            try {
                const response = await apiRequest(`/api/tracking/${code}`);
                if (response.success) {
                    this.renderTrackingResult(response.data, trackingResult);
                }
            } catch (error) {
                showToast(error.message || 'Không tìm thấy hồ sơ', 'error');
                if (trackingResult) {
                    trackingResult.innerHTML = `
                        <div class="text-center py-8">
                            <svg class="w-16 h-16 mx-auto text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4m0 4h.01"/>
                            </svg>
                            <p class="text-muted">Không tìm thấy hồ sơ với mã số <strong>${code}</strong></p>
                            <p class="text-sm text-muted mt-2">Vui lòng kiểm tra lại mã hồ sơ</p>
                        </div>
                    `;
                }
            }
        });
    }

    /**
     * Render tracking result
     */
    renderTrackingResult(data, container) {
        if (!container) return;

        const statusColors = {
            'completed': 'text-success',
            'processing': 'text-accent',
            'pending': 'text-muted'
        };

        const stepIcons = {
            'completed': `<svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
            'processing': `<svg class="w-5 h-5 text-accent animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`,
            'pending': `<div class="w-5 h-5 rounded-full border-2 border-muted"></div>`
        };

        container.innerHTML = `
            <div class="bg-white rounded-formal-lg shadow-formal-card p-6 border border-border">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <span class="text-sm text-muted">Mã hồ sơ</span>
                        <h3 class="font-heading text-2xl font-semibold text-primary">${data.code}</h3>
                    </div>
                    <span class="px-4 py-2 rounded-formal text-sm font-semibold ${data.status === 'completed' ? 'bg-success/10 text-success border border-success/30' : 'bg-accent/10 text-accent border border-accent/30'}">
                        ${data.statusText}
                    </span>
                </div>
                
                <div class="grid sm:grid-cols-2 gap-4 mb-6 p-4 bg-background rounded-formal border border-border">
                    <div>
                        <span class="text-sm text-muted">Dịch vụ</span>
                        <p class="font-semibold text-primary">${data.serviceName}</p>
                    </div>
                    <div>
                        <span class="text-sm text-muted">Người nộp</span>
                        <p class="font-semibold text-primary">${data.applicantName}</p>
                    </div>
                    <div>
                        <span class="text-sm text-muted">Ngày nộp</span>
                        <p class="font-semibold text-primary">${formatDate(data.submittedDate)}</p>
                    </div>
                    <div>
                        <span class="text-sm text-muted">Cơ quan xử lý</span>
                        <p class="font-semibold text-primary">${data.agency}</p>
                    </div>
                </div>
                
                <h4 class="font-heading font-semibold text-lg text-primary mb-4">Tiến độ xử lý</h4>
                <div class="space-y-4">
                    ${data.steps.map((step, index) => `
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 mt-1">
                                ${stepIcons[step.status]}
                            </div>
                            <div class="flex-1">
                                <p class="font-medium ${statusColors[step.status]}">${step.name}</p>
                                ${step.date ? `<p class="text-sm text-muted">${step.date}</p>` : ''}
                            </div>
                        </div>
                        ${index < data.steps.length - 1 ? '<div class="ml-2.5 w-0.5 h-6 bg-border"></div>' : ''}
                    `).join('')}
                </div>
                
                ${data.status !== 'completed' ? `
                    <div class="mt-6 p-4 bg-accent/10 rounded-formal border border-accent/30">
                        <p class="text-sm text-accent">
                            <strong>Dự kiến hoàn thành:</strong> ${formatDate(data.estimatedCompletion)}
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Setup smooth scroll for anchor links
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const navHeight = 100; // Account for fixed nav
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// ============ INITIALIZE APP ============

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DichVuCongApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DichVuCongApp, apiRequest, showToast, formatDate, formatNumber };
}
