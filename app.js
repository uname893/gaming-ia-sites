// AutoPress AI - Application
const app = {
    apiKey: localStorage.getItem('nvidia_api_key') || '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',
    apiEndpoint: 'https://integrate.api.nvidia.com/v1',
    articles: JSON.parse(localStorage.getItem('articles') || '[]'),
    currentFilter: 'all',
    currentYearFilter: 'all',
    currentArticle: null,
    credits: parseInt(localStorage.getItem('nvidia_credits') || '1000'),
    categories: [
        { id: 'gaming', label: 'Gaming', emoji: '🎮', color: '#ec4899' },
        { id: 'pc', label: 'PC Composants', emoji: '💻', color: '#6366f1' },
        { id: 'laptop', label: 'Laptops', emoji: '💻', color: '#8b5cf6' },
        { id: 'smartphone', label: 'Smartphones', emoji: '📱', color: '#f59e0b' },
        { id: 'voiture', label: 'Voitures Électriques', emoji: '🚗', color: '#22c55e' },
        { id: 'trottinette', label: 'Trottinettes & Scooters', emoji: '🛴', color: '#14b8a6' },
        { id: 'ia', label: 'IA & Tech', emoji: '🤖', color: '#a855f7' },
        { id: 'tech', label: 'Tech Général', emoji: '⚡', color: '#3b82f6' }
    ],
    years: ['2024', '2025', '2026', '2027'],

    init() {
        if (this.articles.length === 0) {
            this.articles = [...demoArticles];
            this.saveArticles();
        }
        this.setupNavigation();
        this.setupForms();
        this.setupFilters();
        this.setupModal();
        this.loadSettings();
        this.renderArticles();
        this.updateDashboard();
        this.updateApiStatus();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });
    },

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const section = document.getElementById(sectionId);
        const link = document.querySelector(`a[href="#${sectionId}"]`);
        if (section) section.classList.add('active');
        if (link) link.classList.add('active');
        if (sectionId === 'dashboard') this.updateDashboard();
        if (sectionId === 'articles') this.renderArticles();
    },

    setupForms() {
        document.getElementById('generate-btn').addEventListener('click', () => this.generateArticle());
        document.getElementById('regenerate-btn').addEventListener('click', () => this.generateArticle());
        document.getElementById('publish-btn').addEventListener('click', () => this.publishArticle());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('toggle-key').addEventListener('click', () => this.toggleKeyVisibility());
        document.getElementById('setting-temp').addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
        document.getElementById('setting-tokens').addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
    },

    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderArticles();
            });
        });
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentYearFilter = btn.dataset.year;
                this.renderArticles();
            });
        });
    },

    setupModal() {
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
    },

    loadSettings() {
        const key = localStorage.getItem('nvidia_api_key');
        if (key) document.getElementById('api-key').value = key;
        const temp = localStorage.getItem('setting_temp') || '0.7';
        const tokens = localStorage.getItem('setting_tokens') || '2048';
        document.getElementById('setting-temp').value = temp;
        document.getElementById('setting-temp').nextElementSibling.textContent = temp;
        document.getElementById('setting-tokens').value = tokens;
        document.getElementById('setting-tokens').nextElementSibling.textContent = tokens;
    },

    saveSettings() {
        const key = document.getElementById('api-key').value.trim();
        const temp = document.getElementById('setting-temp').value;
        const tokens = document.getElementById('setting-tokens').value;
        if (key) { localStorage.setItem('nvidia_api_key', key); this.apiKey = key; }
        localStorage.setItem('setting_temp', temp);
        localStorage.setItem('setting_tokens', tokens);
        this.showToast('Paramètres sauvegardés ✓');
        this.updateApiStatus();
    },

    toggleKeyVisibility() {
        const input = document.getElementById('api-key');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    updateApiStatus() {
        const dot = document.querySelector('.status-dot');
        const btn = document.getElementById('api-status');
        if (!this.apiKey) {
            dot.className = 'status-dot offline';
            btn.innerHTML = '<span class="status-dot offline"></span> API NVIDIA';
        } else {
            dot.className = 'status-dot pending';
            btn.innerHTML = '<span class="status-dot pending"></span> Vérification...';
            this.testApi().then(valid => {
                if (valid) {
                    dot.className = 'status-dot online';
                    btn.innerHTML = '<span class="status-dot online"></span> API Connecté';
                } else {
                    dot.className = 'status-dot offline';
                    btn.innerHTML = '<span class="status-dot offline"></span> API Invalide';
                }
            }).catch(() => {
                dot.className = 'status-dot offline';
                btn.innerHTML = '<span class="status-dot offline"></span> API Erreur';
            });
        }
    },

    async testApi() {
        try {
            const response = await fetch(`${this.apiEndpoint}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.ok;
        } catch { return false; }
    },

    async generateArticle() {
        if (!this.apiKey) {
            this.showToast('Configure d\'abord ta clé API dans les paramètres ⚠️');
            this.showSection('settings');
            return;
        }
        if (this.credits < 10) {
            this.showToast('Crédits API insuffisants ! ⚠️');
            return;
        }

        const topic = document.getElementById('article-topic').value.trim();
        if (!topic) {
            this.showToast('Entre un sujet d\'article ⚠️');
            return;
        }

        const btn = document.getElementById('generate-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoading = btn.querySelector('.btn-loading');
        const previewStatus = document.getElementById('preview-status');
        const previewContent = document.getElementById('preview-content');
        const previewActions = document.getElementById('preview-actions');

        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        previewStatus.textContent = 'Génération en cours...';
        previewContent.innerHTML = '<div class="preview-placeholder"><div class="placeholder-icon">⚡</div><p>Génération en cours...</p><small>L\'IA écrit ton article</small></div>';
        previewActions.style.display = 'none';

        try {
            const category = document.getElementById('article-category').value;
            const year = document.getElementById('article-year').value;
            const length = document.getElementById('article-length').value;
            const keywords = document.getElementById('article-keywords').value.trim();
            const model = document.getElementById('model-select').value;
            const temp = parseFloat(localStorage.getItem('setting_temp') || '0.7');
            const maxTokens = parseInt(localStorage.getItem('setting_tokens') || '2048');

            const catInfo = this.categories.find(c => c.id === category);
            const lengthMap = { short: '300 mots', medium: '600 mots', long: '1200 mots' };
            const yearContext = year === '2027' ? 'prévisions et tendances pour 2027' : 
                               year === '2026' ? 'actualités et nouveautés de 2026' :
                               year === '2025' ? 'rétrospective 2025' : 'rétrospective 2024';

            const prompt = `Rédige un article de blog ${lengthMap[length]} en français sur le sujet suivant : "${topic}"

Catégorie : ${catInfo.label}
Contexte temporel : ${yearContext}
${keywords ? `Mots-clés à inclure : ${keywords}` : ''}

Structure requise :
- Titre accrocheur (format : ## Titre)
- Introduction engageante
- 2-3 sections avec sous-titres (format : ### Sous-titre)
- Points clés sous forme de liste à puces
- Conclusion

Règles :
- Écris un contenu original et informatif
- Mentionne l'année ${year} quand c'est pertinent
- Utilise un ton journalistique professionnel
- Inclus les mots-clés naturellement dans le texte
- Formate avec Markdown (## pour les titres, ### pour les sous-titres, - pour les listes)
- Ne répète pas les instructions, écris directement l'article`;

            const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: 'Tu es un rédacteur professionnel spécialisé dans les articles tech, gaming, hardware et innovations. Tu écris du contenu original, engageant et bien structuré en français.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: temp,
                    max_tokens: maxTokens,
                    stream: false
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `Erreur API: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Estimate credits used (rough approximation)
            const usedCredits = Math.ceil((data.usage?.total_tokens || 1000) / 100);
            this.credits = Math.max(0, this.credits - usedCredits);
            localStorage.setItem('nvidia_credits', this.credits.toString());
            this.updateDashboard();

            const parsed = this.parseArticle(content, topic, category, year);
            this.currentArticle = parsed;

            previewContent.innerHTML = parsed.html;
            previewContent.classList.add('article-rendered');
            previewStatus.textContent = `✓ Prêt à publier (Crédits: -${usedCredits})`;
            previewActions.style.display = 'flex';
            this.showToast('Article généré avec succès ✓');

        } catch (error) {
            console.error('Erreur génération:', error);
            previewContent.innerHTML = `<div class="preview-placeholder"><div class="placeholder-icon" style="color:var(--error)">❌</div><p>Erreur de génération</p><small>${error.message}</small></div>`;
            previewStatus.textContent = 'Erreur';
            this.showToast('Erreur: ' + error.message);
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    },

    parseArticle(content, topic, category, year) {
        const titleMatch = content.match(/^##\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : topic;
        let body = content.replace(/^##\s*.+\n?/m, '').trim();
        let html = body
            .replace(/###\s*(.+)/g, '<h3>$1</h3>')
            .replace(/##\s*(.+)/g, '<h2>$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n\s*-\s*(.+)/g, '<li>$1</li>');
        html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><(h[23]|ul)>/g, '<$1>');
        html = html.replace(/<\/(h[23]|ul)><\/p>/g, '</$1>');

        return {
            title, body, year,
            html: `<h2>${title}</h2>${html}`,
            category, topic,
            excerpt: body.substring(0, 200) + '...',
            timestamp: new Date().toISOString()
        };
    },

    publishArticle() {
        if (!this.currentArticle) return;
        const article = {
            id: Date.now(),
            title: this.currentArticle.title,
            body: this.currentArticle.body,
            html: this.currentArticle.html,
            category: this.currentArticle.category,
            year: this.currentArticle.year,
            topic: this.currentArticle.topic,
            excerpt: this.currentArticle.excerpt,
            timestamp: new Date().toISOString(),
            views: 0,
            tags: this.generateTags(this.currentArticle.topic, this.currentArticle.category)
        };
        this.articles.unshift(article);
        this.saveArticles();
        this.addActivity(`Article publié: "${article.title}"`);
        this.showToast('Article publié ✓');
        this.showSection('articles');
        this.renderArticles();
        document.getElementById('preview-content').innerHTML = '<div class="preview-placeholder"><div class="placeholder-icon">✨</div><p>L\'article généré apparaîtra ici</p></div>';
        document.getElementById('preview-content').classList.remove('article-rendered');
        document.getElementById('preview-status').textContent = 'En attente...';
        document.getElementById('preview-actions').style.display = 'none';
        this.currentArticle = null;
    },

    generateTags(topic, category) {
        const tags = [category];
        const keywords = topic.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
        tags.push(...keywords.slice(0, 2));
        return [...new Set(tags)].slice(0, 4);
    },

    renderArticles() {
        const container = document.getElementById('articles-container');
        let filtered = this.articles;
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(a => a.category === this.currentFilter);
        }
        if (this.currentYearFilter !== 'all') {
            filtered = filtered.filter(a => a.year === this.currentYearFilter || 
                new Date(a.timestamp).getFullYear().toString() === this.currentYearFilter);
        }
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>${this.currentFilter === 'all' && this.currentYearFilter === 'all' ? 'Aucun article encore' : 'Aucun article dans cette sélection'}</h3>
                    <p>${this.currentFilter === 'all' && this.currentYearFilter === 'all' ? 'Génère ton premier article avec l\'API NVIDIA' : 'Essaye une autre catégorie/année ou génère un article'}</p>
                    <button class="btn btn-primary" onclick="app.showSection('generate')">✨ Générer un Article</button>
                </div>
            `;
            return;
        }
        container.innerHTML = filtered.map(article => this.createArticleCard(article)).join('');
        container.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => this.openArticle(parseInt(card.dataset.id)));
        });
    },

    createArticleCard(article) {
        const date = new Date(article.timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const catInfo = this.categories.find(c => c.id === article.category) || { 
            label: article.category, emoji: '📝', color: '#6366f1' 
        };
        return `
            <div class="article-card" data-id="${article.id}"
                 style="border-left: 3px solid ${catInfo.color}">
                <div class="article-image" style="background: linear-gradient(135deg, ${catInfo.color}22, ${catInfo.color}44)">
                    <span style="font-size:4rem; opacity:0.3">${catInfo.emoji}</span>
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <span class="article-category" style="color: ${catInfo.color}">${catInfo.label}</span>
                        <span>•</span>
                        <span>${date}</span>
                        ${article.year ? `<span>•</span><span>${article.year}</span>` : ''}
                    </div>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${article.excerpt}</p>
                </div>
                <div class="article-footer">
                    <div class="article-tags">
                        ${article.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <span>👁 ${article.views || 0}</span>
                </div>
            </div>
        `;
    },

    openArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;
        article.views = (article.views || 0) + 1;
        this.saveArticles();
        this.renderArticles();
        const date = new Date(article.timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const catInfo = this.categories.find(c => c.id === article.category) || { label: article.category, color: '#6366f1' };
        const modal = document.getElementById('article-modal');
        const content = document.getElementById('article-full');
        content.innerHTML = `
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span style="color: ${catInfo.color}">${catInfo.label}</span>
                <span>•</span>
                <span>${date}</span>
                ${article.year ? `<span>•</span><span>${article.year}</span>` : ''}
                <span>•</span>
                <span>👁 ${article.views} vues</span>
            </div>
            <div class="article-body">${article.html}</div>
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 0.8rem;">
                <button class="btn btn-secondary" onclick="app.shareArticle(${article.id})">📤 Partager</button>
                <button class="btn btn-secondary" onclick="app.deleteArticle(${article.id})">🗑️ Supprimer</button>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        document.getElementById('article-modal').classList.remove('active');
        document.body.style.overflow = '';
    },

    deleteArticle(id) {
        if (!confirm('Supprimer cet article ?')) return;
        this.articles = this.articles.filter(a => a.id !== id);
        this.saveArticles();
        this.closeModal();
        this.renderArticles();
        this.updateDashboard();
        this.showToast('Article supprimé');
    },

    shareArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;
        const text = `${article.title}\n\n${article.excerpt}\n\n#AutoPressAI`;
        if (navigator.share) {
            navigator.share({ title: article.title, text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Article copié dans le presse-papiers');
            });
        }
    },

    updateDashboard() {
        const total = this.articles.length;
        const today = new Date().toDateString();
        const generated = this.articles.filter(a => new Date(a.timestamp).toDateString() === today).length;
        const categories = new Set(this.articles.map(a => a.category)).size;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-generated').textContent = generated;
        document.getElementById('stat-categories').textContent = categories;
        
        // Update credits display
        const creditsEl = document.getElementById('stat-credits');
        if (creditsEl) {
            creditsEl.textContent = this.credits;
            const fill = document.getElementById('credit-fill');
            if (fill) fill.style.width = `${Math.min(100, (this.credits / 1000) * 100)}%`;
        }

        const activityList = document.getElementById('activity-list');
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        if (activities.length === 0) {
            activityList.innerHTML = '<div class="activity-empty">Aucune activité pour le moment</div>';
        } else {
            activityList.innerHTML = activities.slice(0, 10).map(act => {
                const time = new Date(act.time).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                return `
                    <div class="activity-item">
                        <span class="activity-icon">${act.icon || '📝'}</span>
                        <span class="activity-text">${act.text}</span>
                        <span class="activity-time">${time}</span>
                    </div>
                `;
            }).join('');
        }
    },

    addActivity(text, icon = '📝') {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        activities.unshift({ text, icon, time: new Date().toISOString() });
        localStorage.setItem('activities', JSON.stringify(activities.slice(0, 50)));
        this.updateDashboard();
    },

    saveArticles() {
        localStorage.setItem('articles', JSON.stringify(this.articles));
    },

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: var(--accent);
            color: white;
            border-radius: var(--radius-sm);
            font-weight: 500;
            z-index: 300;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

const demoArticles = [
    {
        id: 1000,
        title: "NVIDIA Build et les API IA gratuits en 2026 : révolution dans le monde de l'intelligence artificielle",
        body: "Introduction\n\nNVIDIA, leader dans le domaine des cartes graphiques et de l'intelligence artificielle, a récemment annoncé le lancement de NVIDIA Build...",
        html: "<h2>NVIDIA Build et les API IA gratuits en 2026</h2><p>Article sur les API NVIDIA...</p>",
        category: "tech", year: "2026",
        topic: "NVIDIA Build API IA gratuits",
        excerpt: "NVIDIA, leader dans le domaine des cartes graphiques et de l'intelligence artificielle, a récemment annoncé le lancement de NVIDIA Build...",
        timestamp: new Date().toISOString(),
        views: 247,
        tags: ["tech", "nvidia", "ia"]
    },
    {
        id: 1001,
        title: "L'IA Générative Révolutionne le Gaming en 2026",
        body: "L'intelligence artificielle transforme l'industrie du jeu vidéo à une vitesse sans précédent...",
        html: "<h2>L'IA Générative Révolutionne le Gaming en 2026</h2><p>Article sur l'IA dans le gaming...</p>",
        category: "gaming", year: "2026",
        topic: "IA dans le gaming",
        excerpt: "L'intelligence artificielle transforme l'industrie du jeu vidéo à une vitesse sans précédent...",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        views: 142,
        tags: ["gaming", "ia", "nvidia"]
    },
    {
        id: 1002,
        title: "NVIDIA NIM : L'API Gratuite pour 100+ Modèles d'IA",
        body: "NVIDIA a changé la donne en 2026 avec l'ouverture de son catalogue de modèles d'IA...",
        html: "<h2>NVIDIA NIM : L'API Gratuite pour 100+ Modèles d'IA</h2><p>Article sur NVIDIA NIM...</p>",
        category: "tech", year: "2026",
        topic: "NVIDIA NIM API",
        excerpt: "NVIDIA a changé la donne en 2026 avec l'ouverture de son catalogue de modèles d'IA...",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        views: 89,
        tags: ["tech", "nvidia", "api"]
    },
    {
        id: 1003,
        title: "DeepSeek V3.1 : Le Nouveau Champion du Code",
        body: "DeepSeek a marqué 2026 avec la sortie de sa version 3.1...",
        html: "<h2>DeepSeek V3.1 : Le Nouveau Champion du Code</h2><p>Article sur DeepSeek...</p>",
        category: "ia", year: "2026",
        topic: "DeepSeek V3.1",
        excerpt: "DeepSeek a marqué 2026 avec la sortie de sa version 3.1...",
        timestamp: new Date().toISOString(),
        views: 56,
        tags: ["ia", "deepseek", "code"]
    }
];

document.addEventListener('DOMContentLoaded', () => app.init());
