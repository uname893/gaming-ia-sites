// AutoPress AI - Application
const app = {
    apiKey: localStorage.getItem('nvidia_api_key') || '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',
    apiEndpoint: 'https://integrate.api.nvidia.com/v1',
    articles: JSON.parse(localStorage.getItem('articles') || '[]'),
    currentFilter: 'all',
    currentArticle: null,

    init() {
        // Load demo articles if first visit
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

    // Navigation
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

    // Setup Forms
    setupForms() {
        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => this.generateArticle());
        
        // Regenerate button
        document.getElementById('regenerate-btn').addEventListener('click', () => this.generateArticle());
        
        // Publish button
        document.getElementById('publish-btn').addEventListener('click', () => this.publishArticle());
        
        // Save settings
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        
        // Toggle API key visibility
        document.getElementById('toggle-key').addEventListener('click', () => this.toggleKeyVisibility());
        
        // Range inputs
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
    },

    setupModal() {
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
    },

    // Load settings
    loadSettings() {
        const key = localStorage.getItem('nvidia_api_key');
        if (key) {
            document.getElementById('api-key').value = key;
        }
        
        const temp = localStorage.getItem('setting_temp') || '0.7';
        const tokens = localStorage.getItem('setting_tokens') || '2048';
        
        document.getElementById('setting-temp').value = temp;
        document.getElementById('setting-temp').nextElementSibling.textContent = temp;
        document.getElementById('setting-tokens').value = tokens;
        document.getElementById('setting-tokens').nextElementSibling.textContent = tokens;
    },

    // Save settings
    saveSettings() {
        const key = document.getElementById('api-key').value.trim();
        const temp = document.getElementById('setting-temp').value;
        const tokens = document.getElementById('setting-tokens').value;
        
        if (key) {
            localStorage.setItem('nvidia_api_key', key);
            this.apiKey = key;
        }
        
        localStorage.setItem('setting_temp', temp);
        localStorage.setItem('setting_tokens', tokens);
        
        this.showToast('Paramètres sauvegardés ✓');
        this.updateApiStatus();
    },

    toggleKeyVisibility() {
        const input = document.getElementById('api-key');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    // Update API status indicator
    updateApiStatus() {
        const dot = document.querySelector('.status-dot');
        const btn = document.getElementById('api-status');
        
        if (!this.apiKey) {
            dot.className = 'status-dot offline';
            btn.innerHTML = '<span class="status-dot offline"></span> API NVIDIA';
        } else {
            dot.className = 'status-dot pending';
            btn.innerHTML = '<span class="status-dot pending"></span> Vérification...';
            
            // Test API
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
        } catch {
            return false;
        }
    },

    // Generate article using NVIDIA API
    async generateArticle() {
        if (!this.apiKey) {
            this.showToast('Configure d\'abord ta clé API dans les paramètres ⚠️');
            this.showSection('settings');
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

        // UI loading state
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        previewStatus.textContent = 'Génération en cours...';
        previewContent.innerHTML = '<div class="preview-placeholder"><div class="placeholder-icon">⚡</div><p>Génération en cours...</p><small>L\'IA écrit ton article</small></div>';
        previewActions.style.display = 'none';

        try {
            const category = document.getElementById('article-category').value;
            const tone = document.getElementById('article-tone').value;
            const length = document.getElementById('article-length').value;
            const lang = document.getElementById('article-lang').value;
            const keywords = document.getElementById('article-keywords').value.trim();
            const model = document.getElementById('model-select').value;
            const temp = parseFloat(localStorage.getItem('setting_temp') || '0.7');
            const maxTokens = parseInt(localStorage.getItem('setting_tokens') || '2048');

            const lengthMap = { short: '300 mots', medium: '600 mots', long: '1200 mots' };
            const toneMap = {
                professional: 'professionnel et formel',
                casual: 'décontracté et accessible',
                technical: 'technique et détaillé',
                journalistic: 'journalistique et objectif',
                humorous: 'humoristique et léger'
            };
            const langMap = { fr: 'français', en: 'anglais', es: 'espagnol', de: 'allemand' };

            const prompt = `Rédige un article de blog ${lengthMap[length]} en ${langMap[lang]} sur le sujet suivant : "${topic}"

Catégorie : ${category}
Ton : ${toneMap[tone]}
${keywords ? `Mots-clés à inclure : ${keywords}` : ''}

Structure requise :
- Titre accrocheur (format : ## Titre)
- Introduction engageante
- 2-3 sections avec sous-titres (format : ### Sous-titre)
- Points clés sous forme de liste à puces
- Conclusion

Règles :
- Écris un contenu original et informatif
- Utilise un ton ${toneMap[tone]}
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
                        { role: 'system', content: 'Tu es un rédacteur professionnel spécialisé dans la rédaction d\'articles de blog de qualité. Tu écris du contenu original, engageant et bien structuré.' },
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

            // Parse markdown content
            const parsed = this.parseArticle(content, topic, category);
            this.currentArticle = parsed;

            // Render preview
            previewContent.innerHTML = parsed.html;
            previewContent.classList.add('article-rendered');
            previewStatus.textContent = '✓ Prêt à publier';
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

    // Parse article markdown to HTML
    parseArticle(content, topic, category) {
        // Extract title (first ## heading)
        const titleMatch = content.match(/^##\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : topic;
        
        // Remove title from content
        let body = content.replace(/^##\s*.+\n?/m, '').trim();
        
        // Convert markdown to HTML
        let html = body
            .replace(/###\s*(.+)/g, '<h3>$1</h3>')
            .replace(/##\s*(.+)/g, '<h2>$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n\s*-\s*(.+)/g, '<li>$1</li>');

        // Wrap lists
        html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Wrap paragraphs
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><(h[23]|ul)>/g, '<$1>');
        html = html.replace(/<\/(h[23]|ul)><\/p>/g, '</$1>');

        return {
            title,
            body,
            html: `<h2>${title}</h2>${html}`,
            category,
            topic,
            excerpt: body.substring(0, 200) + '...',
            timestamp: new Date().toISOString()
        };
    },

    // Publish article
    publishArticle() {
        if (!this.currentArticle) return;

        const article = {
            id: Date.now(),
            title: this.currentArticle.title,
            body: this.currentArticle.body,
            html: this.currentArticle.html,
            category: this.currentArticle.category,
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
        
        // Reset preview
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

    // Render articles grid
    renderArticles() {
        const container = document.getElementById('articles-container');
        
        let filtered = this.articles;
        if (this.currentFilter !== 'all') {
            filtered = this.articles.filter(a => a.category === this.currentFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>${this.currentFilter === 'all' ? 'Aucun article encore' : 'Aucun article dans cette catégorie'}</h3>
                    <p>${this.currentFilter === 'all' ? 'Génère ton premier article avec l\'API NVIDIA' : 'Essaye une autre catégorie ou génère un article'}</p>
                    <button class="btn btn-primary" onclick="app.showSection('generate')">✨ Générer un Article</button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(article => this.createArticleCard(article)).join('');

        // Add click handlers
        container.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => this.openArticle(parseInt(card.dataset.id)));
        });
    },

    createArticleCard(article) {
        const date = new Date(article.timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        
        const categoryLabels = {
            tech: 'Technologie', gaming: 'Gaming', ia: 'IA',
            science: 'Science', business: 'Business', culture: 'Culture'
        };

        const categoryColors = {
            tech: '#6366f1', gaming: '#ec4899', ia: '#8b5cf6',
            science: '#14b8a6', business: '#f59e0b', culture: '#f97316'
        };

        const emoji = {
            tech: '💻', gaming: '🎮', ia: '🤖',
            science: '🔬', business: '💼', culture: '🎭'
        };

        return `
            <div class="article-card" data-id="${article.id}"
                 style="border-left: 3px solid ${categoryColors[article.category] || '#6366f1'}">
                <div class="article-image" style="background: linear-gradient(135deg, ${categoryColors[article.category] || '#6366f1'}22, ${categoryColors[article.category] || '#6366f1'}44)">
                    <span style="font-size:4rem; opacity:0.3">${emoji[article.category] || '📝'}</span>
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <span class="article-category" style="color: ${categoryColors[article.category] || '#6366f1'}">${categoryLabels[article.category] || article.category}</span>
                        <span>•</span>
                        <span>${date}</span>
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

    // Open article modal
    openArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        // Increment views
        article.views = (article.views || 0) + 1;
        this.saveArticles();
        this.renderArticles();

        const date = new Date(article.timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const categoryLabels = {
            tech: 'Technologie', gaming: 'Gaming', ia: 'IA',
            science: 'Science', business: 'Business', culture: 'Culture'
        };

        const modal = document.getElementById('article-modal');
        const content = document.getElementById('article-full');

        content.innerHTML = `
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span style="color: var(--accent-light)">${categoryLabels[article.category] || article.category}</span>
                <span>•</span>
                <span>${date}</span>
                <span>•</span>
                <span>👁 ${article.views} vues</span>
            </div>
            <div class="article-body">
                ${article.html}
            </div>
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

    // Dashboard
    updateDashboard() {
        const total = this.articles.length;
        const today = new Date().toDateString();
        const generated = this.articles.filter(a => new Date(a.timestamp).toDateString() === today).length;
        const views = this.articles.reduce((sum, a) => sum + (a.views || 0), 0);
        const categories = new Set(this.articles.map(a => a.category)).size;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-generated').textContent = generated;
        document.getElementById('stat-views').textContent = views.toLocaleString();
        document.getElementById('stat-categories').textContent = categories;

        // Update activity list
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

    // Save articles
    saveArticles() {
        localStorage.setItem('articles', JSON.stringify(this.articles));
    },

    // Toast notification
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

// CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Demo articles
const demoArticles = [
    {
        id: 1000,
        title: "NVIDIA Build et les API IA gratuits en 2026 : révolution dans le monde de l'intelligence artificielle",
        body: `### Introduction\n\nNVIDIA, leader dans le domaine des cartes graphiques et de l'intelligence artificielle, a récemment annoncé le lancement de NVIDIA Build, une plateforme visant à faciliter le développement et le déploiement d'applications IA. Mais ce qui est encore plus intéressant, c'est que NVIDIA propose désormais des API IA gratuits pour les développeurs.\n\n### NVIDIA Build : une plateforme pour les développeurs\n\nNVIDIA Build est une plateforme complète qui permet aux développeurs de créer, d'entraîner et de déployer des modèles IA de manière efficace. Elle offre une variété d'outils et de services, notamment des bibliothèques de code, des modèles pré-entraînés et des services de cloud pour le déploiement.\n\n- Bibliothèques de code optimisées\n- Modèles pré-entraînés prêts à l'emploi\n- Services de cloud pour le déploiement rapide\n- Infrastructure gérée par NVIDIA\n\n### Les API IA gratuits : un game-changer\n\nL'annonce la plus importante est la mise à disposition des API IA gratuits pour les développeurs. Ces API permettent aux développeurs d'accéder à des capacités IA avancées sans avoir à payer des frais de licence élevés. Cela signifie que les développeurs peuvent créer des applications IA sans avoir à se soucier des coûts.\n\n### Conclusion\n\nLes API IA gratuits de NVIDIA représentent une avancée significative pour l'industrie de l'intelligence artificielle. En rendant ces technologies accessibles à tous, NVIDIA ouvre la voie à une nouvelle génération d'applications IA innovantes et créatives.`,
        html: `<h2>NVIDIA Build et les API IA gratuits en 2026 : révolution dans le monde de l'intelligence artificielle</h2><h3>Introduction</h3><p>NVIDIA, leader dans le domaine des cartes graphiques et de l'intelligence artificielle, a récemment annoncé le lancement de NVIDIA Build, une plateforme visant à faciliter le développement et le déploiement d'applications IA. Mais ce qui est encore plus intéressant, c'est que NVIDIA propose désormais des API IA gratuits pour les développeurs.</p><h3>NVIDIA Build : une plateforme pour les développeurs</h3><p>NVIDIA Build est une plateforme complète qui permet aux développeurs de créer, d'entraîner et de déployer des modèles IA de manière efficace. Elle offre une variété d'outils et de services, notamment des bibliothèques de code, des modèles pré-entraînés et des services de cloud pour le déploiement.</p><ul><li><strong>Bibliothèques de code optimisées</strong></li><li><strong>Modèles pré-entraînés prêts à l'emploi</strong></li><li><strong>Services de cloud pour le déploiement rapide</strong></li><li><strong>Infrastructure gérée par NVIDIA</strong></li></ul><h3>Les API IA gratuits : un game-changer</h3><p>L'annonce la plus importante est la mise à disposition des API IA gratuits pour les développeurs. Ces API permettent aux développeurs d'accéder à des capacités IA avancées sans avoir à payer des frais de licence élevés. Cela signifie que les développeurs peuvent créer des applications IA sans avoir à se soucier des coûts.</p><h3>Conclusion</h3><p>Les API IA gratuits de NVIDIA représentent une avancée significative pour l'industrie de l'intelligence artificielle. En rendant ces technologies accessibles à tous, NVIDIA ouvre la voie à une nouvelle génération d'applications IA innovantes et créatives.</p>`,
        category: "tech",
        topic: "NVIDIA Build API IA gratuits",
        excerpt: "NVIDIA, leader dans le domaine des cartes graphiques et de l'intelligence artificielle, a récemment annoncé le lancement de NVIDIA Build...",
        timestamp: new Date().toISOString(),
        views: 247,
        tags: ["tech", "nvidia", "ia"]
    },
    {
        id: 1001,
        title: "L'IA Générative Révolutionne le Gaming en 2026",
        body: `### Introduction\n\nL'intelligence artificielle transforme l'industrie du jeu vidéo à une vitesse sans précédent. En 2026, les moteurs de génération procédurale alimentés par l'IA créent des mondes infinis, des personnages dotés de mémoire conversationnelle et des expériences de jeu véritablement uniques.\n\n### Mondes Procéduraux Infinis\n\nLes nouveaux moteurs de génération de contenu utilisent des modèles de diffusion pour créer des textures, des modèles 3D et des environnements en temps réel. Cela signifie que deux joueurs ne vivront jamais exactement la même expérience.\n\n- **Génération de textures** : Création de surfaces détaillées en quelques millisecondes\n- **Modèles 3D automatisés** : Génération d'assets adaptés au style artistique du jeu\n- **Narration émergente** : Des histoires qui se déploient selon les choix du joueur\n\n### PNJ Révolutionnaires\n\nLes personnages non-joueurs propulsés par des LLM (Large Language Models) peuvent maintenir des conversations naturelles, se souvenir des interactions passées et adapter leur comportement en fonction de la personnalité du joueur.\n\n### Conclusion\n\nL'IA ne remplace pas les développeurs — elle les amplifie. Les créateurs peuvent se concentrer sur la vision artistique pendant que l'IA gère la génération de contenu à grande échelle.`,
        html: `<h2>L'IA Générative Révolutionne le Gaming en 2026</h2><h3>Introduction</h3><p>L'intelligence artificielle transforme l'industrie du jeu vidéo à une vitesse sans précédent. En 2026, les moteurs de génération procédurale alimentés par l'IA créent des mondes infinis, des personnages dotés de mémoire conversationnelle et des expériences de jeu véritablement uniques.</p><h3>Mondes Procéduraux Infinis</h3><p>Les nouveaux moteurs de génération de contenu utilisent des modèles de diffusion pour créer des textures, des modèles 3D et des environnements en temps réel. Cela signifie que deux joueurs ne vivront jamais exactement la même expérience.</p><ul><li><strong>Génération de textures</strong> : Création de surfaces détaillées en quelques millisecondes</li><li><strong>Modèles 3D automatisés</strong> : Génération d'assets adaptés au style artistique du jeu</li><li><strong>Narration émergente</strong> : Des histoires qui se déploient selon les choix du joueur</li></ul><h3>PNJ Révolutionnaires</h3><p>Les personnages non-joueurs propulsés par des LLM (Large Language Models) peuvent maintenir des conversations naturelles, se souvenir des interactions passées et adapter leur comportement en fonction de la personnalité du joueur.</p><h3>Conclusion</h3><p>L'IA ne remplace pas les développeurs — elle les amplifie. Les créateurs peuvent se concentrer sur la vision artistique pendant que l'IA gère la génération de contenu à grande échelle.</p>`,
        category: "gaming",
        topic: "IA dans le gaming",
        excerpt: "L'intelligence artificielle transforme l'industrie du jeu vidéo à une vitesse sans précédent. En 2026, les moteurs de génération procédurale alimentés par l'IA créent des mondes infinis...",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        views: 142,
        tags: ["gaming", "ia", "nvidia"]
    },
    {
        id: 1002,
        title: "NVIDIA NIM : L'API Gratuite pour 100+ Modèles d'IA",
        body: `### Introduction\n\nNVIDIA a changé la donne en 2026 avec l'ouverture de son catalogue de modèles d'IA sur build.nvidia.com. Accessible gratuitement via une API compatible OpenAI, cette plateforme permet aux développeurs d'accéder à des centaines de modèles sans carte bancaire.\n\n### Qu'est-ce que NVIDIA NIM ?\n\nNVIDIA Inference Microservices (NIM) est une plateforme qui héberge des modèles d'IA optimisés sur l'infrastructure DGX Cloud de NVIDIA. L'accès se fait via une API standard compatible OpenAI.\n\n### Les Avantages\n\n- **Gratuit** : 1 000 crédits à l'inscription, 40 requêtes/minute\n- **Compatible OpenAI** : Change juste le base_url et la clé API\n- **Modèles variés** : Llama, DeepSeek, Nemotron, Kimi, GLM, Qwen...\n- **Haute performance** : Exécution optimisée sur GPUs NVIDIA\n\n### Comment Commencer ?\n\nIl suffit de créer un compte gratuit sur build.nvidia.com, générer une clé API au préfixe nvapi-, et pointer ton client OpenAI vers https://integrate.api.nvidia.com/v1.\n\n### Conclusion\n\nNVIDIA positionne sa plateforme comme un hub neutre face aux écosystèmes fermés d'OpenAI et Anthropic. Pour les développeurs, c'est une opportunité unique de prototyper avec des modèles de pointe sans investissement initial.`,
        html: `<h2>NVIDIA NIM : L'API Gratuite pour 100+ Modèles d'IA</h2><h3>Introduction</h3><p>NVIDIA a changé la donne en 2026 avec l'ouverture de son catalogue de modèles d'IA sur build.nvidia.com. Accessible gratuitement via une API compatible OpenAI, cette plateforme permet aux développeurs d'accéder à des centaines de modèles sans carte bancaire.</p><h3>Qu'est-ce que NVIDIA NIM ?</h3><p>NVIDIA Inference Microservices (NIM) est une plateforme qui héberge des modèles d'IA optimisés sur l'infrastructure DGX Cloud de NVIDIA. L'accès se fait via une API standard compatible OpenAI.</p><h3>Les Avantages</h3><ul><li><strong>Gratuit</strong> : 1 000 crédits à l'inscription, 40 requêtes/minute</li><li><strong>Compatible OpenAI</strong> : Change juste le base_url et la clé API</li><li><strong>Modèles variés</strong> : Llama, DeepSeek, Nemotron, Kimi, GLM, Qwen...</li><li><strong>Haute performance</strong> : Exécution optimisée sur GPUs NVIDIA</li></ul><h3>Comment Commencer ?</h3><p>Il suffit de créer un compte gratuit sur build.nvidia.com, générer une clé API au préfixe nvapi-, et pointer ton client OpenAI vers https://integrate.api.nvidia.com/v1.</p><h3>Conclusion</h3><p>NVIDIA positionne sa plateforme comme un hub neutre face aux écosystèmes fermés d'OpenAI et Anthropic. Pour les développeurs, c'est une opportunité unique de prototyper avec des modèles de pointe sans investissement initial.</p>`,
        category: "tech",
        topic: "NVIDIA NIM API",
        excerpt: "NVIDIA a changé la donne en 2026 avec l'ouverture de son catalogue de modèles d'IA sur build.nvidia.com. Accessible gratuitement via une API compatible OpenAI...",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        views: 89,
        tags: ["tech", "nvidia", "api"]
    },
    {
        id: 1003,
        title: "DeepSeek V3.1 : Le Nouveau Champion du Code",
        body: `### Introduction\n\nDeepSeek a marqué 2026 avec la sortie de sa version 3.1, un modèle de 284 milliards de paramètres en architecture Mixture of Experts (MoE) qui domine les benchmarks de programmation.\n\n### Performance Exceptionnelle\n\nAvec une fenêtre de contexte de 1 million de tokens, DeepSeek V3.1 peut analyser des bases de code complètes en une seule passe. Les benchmarks montrent des performances supérieures à GPT-4 sur les tâches de refactoring et de débogage.\n\n### Architecture MoE\n\nL'architecture Mixture of Experts n'active qu'une fraction des paramètres à chaque inférence, réduisant drastiquement les coûts computationnels tout en maintenant une qualité de sortie exceptionnelle.\n\n- **Paramètres totaux** : 284B\n- **Paramètres actifs** : ~37B par token\n- **Contexte** : 1M tokens\n- **Optimisation** : TensorRT-LLM sur GPUs NVIDIA\n\n### Cas d'Usage\n\nDeepSeek V3.1 excelle particulièrement dans :\n\n1. La génération de code multi-fichiers\n2. L'analyse de code legacy\n3. La traduction entre langages de programmation\n4. La documentation automatique\n\n### Conclusion\n\nDisponible gratuitement sur build.nvidia.com, DeepSeek V3.1 représente une alternative puissante et économique aux modèles propriétaires pour les développeurs.`,
        html: `<h2>DeepSeek V3.1 : Le Nouveau Champion du Code</h2><h3>Introduction</h3><p>DeepSeek a marqué 2026 avec la sortie de sa version 3.1, un modèle de 284 milliards de paramètres en architecture Mixture of Experts (MoE) qui domine les benchmarks de programmation.</p><h3>Performance Exceptionnelle</h3><p>Avec une fenêtre de contexte de 1 million de tokens, DeepSeek V3.1 peut analyser des bases de code complètes en une seule passe. Les benchmarks montrent des performances supérieures à GPT-4 sur les tâches de refactoring et de débogage.</p><h3>Architecture MoE</h3><p>L'architecture Mixture of Experts n'active qu'une fraction des paramètres à chaque inférence, réduisant drastiquement les coûts computationnels tout en maintenant une qualité de sortie exceptionnelle.</p><ul><li><strong>Paramètres totaux</strong> : 284B</li><li><strong>Paramètres actifs</strong> : ~37B par token</li><li><strong>Contexte</strong> : 1M tokens</li><li><strong>Optimisation</strong> : TensorRT-LLM sur GPUs NVIDIA</li></ul><h3>Cas d'Usage</h3><p>DeepSeek V3.1 excelle particulièrement dans :</p><ol><li>La génération de code multi-fichiers</li><li>L'analyse de code legacy</li><li>La traduction entre langages de programmation</li><li>La documentation automatique</li></ol><h3>Conclusion</h3><p>Disponible gratuitement sur build.nvidia.com, DeepSeek V3.1 représente une alternative puissante et économique aux modèles propriétaires pour les développeurs.</p>`,
        category: "ia",
        topic: "DeepSeek V3.1",
        excerpt: "DeepSeek a marqué 2026 avec la sortie de sa version 3.1, un modèle de 284 milliards de paramètres en architecture Mixture of Experts (MoE)...",
        timestamp: new Date().toISOString(),
        views: 56,
        tags: ["ia", "deepseek", "code"]
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => app.init());
