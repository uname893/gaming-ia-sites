// Cursor Glow Effect
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.cursor-glow');
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

// Animated Counter
const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
};

const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const number = entry.target;
            const target = parseInt(number.dataset.target);
            animateCounter(number, target);
            statsObserver.unobserve(number);
        }
    });
}, observerOptions);

document.querySelectorAll('.stat-number').forEach(stat => {
    statsObserver.observe(stat);
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.feature-card, .game-card, .section-header');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
});

// AI Demo Terminal
document.getElementById('generate-btn').addEventListener('click', async () => {
    const prompt = document.getElementById('ai-prompt').value.trim();
    const terminal = document.getElementById('terminal-output');
    
    if (!prompt) {
        addLine(terminal, '❌ Erreur: Veuillez entrer une description', 'error');
        return;
    }
    
    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.textContent = 'Génération...';
    
    addLine(terminal, `$ Analyse de la requête: "${prompt}"`, 'command');
    await sleep(800);
    
    addLine(terminal, '> Initialisation du modèle IA...', 'info');
    await sleep(600);
    
    addLine(terminal, '> Chargement des paramètres de génération...', 'info');
    await sleep(500);
    
    addLine(terminal, '> Génération du concept de jeu en cours...', 'info');
    await sleep(1200);
    
    // Generate creative response based on prompt
    const response = generateGameConcept(prompt);
    
    addLine(terminal, '✅ CONCEPT GÉNÉRÉ:', 'success');
    addLine(terminal, '', 'empty');
    
    const lines = response.split('\n');
    for (const line of lines) {
        if (line.trim()) {
            addLine(terminal, line, 'response');
            await sleep(100);
        }
    }
    
    addLine(terminal, '', 'empty');
    addLine(terminal, '> Latence: 1.2s | Tokens: 847 | Confiance: 94.3%', 'meta');
    
    btn.disabled = false;
    btn.textContent = 'Générer ⚡';
});

function addLine(terminal, text, type) {
    const line = document.createElement('div');
    line.className = 'line';
    
    let color = 'var(--light)';
    if (type === 'command') color = '#00d4ff';
    if (type === 'info') color = '#a855f7';
    if (type === 'success') color = '#00ff88';
    if (type === 'error') color = '#ff6b6b';
    if (type === 'meta') color = 'rgba(226,232,240,0.4)';
    if (type === 'response') color = '#e2e8f0';
    
    if (type === 'empty') {
        line.innerHTML = '<span>&nbsp;</span>';
    } else if (type === 'response') {
        line.innerHTML = `<span style="color:${color}; padding-left: 1.5rem;">${escapeHtml(text)}</span>`;
    } else if (type === 'command') {
        line.innerHTML = `<span class="prompt">$</span><span style="color:${color}"> ${escapeHtml(text)}</span>`;
    } else {
        line.innerHTML = `<span style="color:${color}">${escapeHtml(text)}</span>`;
    }
    
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function generateGameConcept(prompt) {
    const genres = ['RPG', 'FPS', 'Stratégie', 'Aventure', 'Roguelike', 'Simulation'];
    const themes = ['Cyberpunk', 'Post-apocalyptique', 'Fantasy', 'Sci-fi', 'Horror', 'Steampunk'];
    
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    
    return `Titre: ${theme} ${genre} — IA Edition
Moteur: Neural Game Core v3.2
Thème: ${theme} dynamique
Gameplay: Adaptatif par IA — difficulté ajustée en temps réel

Features générées:
  • Mondes procéduraux infinis
  • PNJ avec mémoire conversationnelle LLM
  • Génération d'assets par diffusion
  • Équilibrage automatique par ML
  • Narration émergée par IA

Estimation: 120 FPS | RTX 4070+ | 8GB VRAM`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10,10,15,0.95)';
    } else {
        navbar.style.background = 'rgba(10,10,15,0.8)';
    }
    
    lastScroll = currentScroll;
});

// Button click effects
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (!this.disabled) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        }
    });
});

// Add subtle parallax to orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.floating-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.3 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

console.log('🎮 GamingIA — Initialisé avec succès');
console.log('⚡ IA Core v3.2 prêt');
