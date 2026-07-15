// Theme and Rain Toggle Functionality
let matrixAnimationId = null;

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const rainToggle = document.getElementById('rainToggle');
    const html = document.documentElement;
    const canvas = document.getElementById('matrixRain');

    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') || 'dark';
    let rainEnabled = localStorage.getItem('rainEnabled') !== 'false';

    // Apply saved theme on load
    if (savedTheme === 'light') {
        html.classList.add('light-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    // Apply rain visibility on load
    if (!rainEnabled && canvas) {
        canvas.style.display = 'none';
    }
    if (rainToggle) {
        rainToggle.style.opacity = rainEnabled ? '1' : '0.5';
    }

    // Theme toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('light-theme');
            const isLight = html.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        });
    }

    // Rain toggle handler
    if (rainToggle && canvas) {
        rainToggle.addEventListener('click', () => {
            rainEnabled = !rainEnabled;

            if (rainEnabled) {
                canvas.style.display = 'block';
                startMatrixRain();
                rainToggle.style.opacity = '1';
            } else {
                stopMatrixRain();
                canvas.style.display = 'none';
                rainToggle.style.opacity = '0.5';
            }

            localStorage.setItem('rainEnabled', rainEnabled);
        });
    }
});

// Shared mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    const closeMenu = () => {
        links.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', event => {
        event.stopPropagation();
        const isOpen = links.classList.toggle('active');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
        if (links.classList.contains('active')
            && !event.target.closest('.nav-links')
            && !event.target.closest('.mobile-nav-toggle')) {
            closeMenu();
        }
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMenu();
    });
});

// Matrix Rain Control Functions
function startMatrixRain() {
    const canvas = document.getElementById('matrixRain');
    if (!canvas || matrixAnimationId) return;

    const ctx = canvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    function drawMatrixRain() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    function animate() {
        drawMatrixRain();
        matrixAnimationId = requestAnimationFrame(animate);
    }

    animate();
}

function stopMatrixRain() {
    if (matrixAnimationId) {
        cancelAnimationFrame(matrixAnimationId);
        matrixAnimationId = null;
    }
}

// Initialize Matrix Rain on page load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('matrixRain');
    if (canvas) {
        // Set canvas size to window size
        function resizeCanvas() {
            const wasRunning = Boolean(matrixAnimationId);
            if (wasRunning) stopMatrixRain();
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (wasRunning) startMatrixRain();
        }

        // Initial resize
        resizeCanvas();

        // Resize canvas when window is resized
        window.addEventListener('resize', resizeCanvas);

        // Check if rain is enabled
        const rainEnabled = localStorage.getItem('rainEnabled') !== 'false';

        // Start rain animation if enabled
        if (rainEnabled) {
            startMatrixRain();
        }
    }
});



// Typing effect for terminal
class TypingEffect {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.currentChar = 0;
        this.element.textContent = ''; // Clear any existing content
        this.type();
    }

    type() {
        if (this.currentChar < this.text.length) {
            this.element.textContent += this.text.charAt(this.currentChar);
            this.currentChar++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const selector = this.getAttribute('href');
        if (!selector || selector === '#') return;
        const target = document.querySelector(selector);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize terminal effect
document.addEventListener('DOMContentLoaded', () => {
    // Initialize research terminal
    const researchTerminal = document.querySelector('.research-terminal .terminal-content');
    if (researchTerminal) {
        const terminalTexts = researchTerminal.querySelectorAll('.typing-text');
        terminalTexts.forEach((text, index) => {
            const originalText = text.textContent;
            text.textContent = ''; // Clear the text before starting animation
            setTimeout(() => {
                new TypingEffect(text, originalText, 50);
            }, index * 800); // Slightly faster than system terminal
        });
    }

    // Initialize projects terminal
    const projectsTerminal = document.querySelector('.projects-terminal .terminal-content');
    if (projectsTerminal) {
        const terminalTexts = projectsTerminal.querySelectorAll('.typing-text');
        terminalTexts.forEach((text, index) => {
            const originalText = text.textContent;
            text.textContent = ''; // Clear the text before starting animation
            setTimeout(() => {
                new TypingEffect(text, originalText, 50);
            }, index * 800); // Match research terminal speed
        });
    }
});

// Form validation and submission handling with Formspree
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    // Real-time validation for form fields
    const formInputs = contactForm.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            // Remove error state while typing
            input.classList.remove('error');
        });
    });

    // Validate individual field
    function validateField(field) {
        const value = field.value.trim();

        if (!value) {
            field.classList.add('error');
            return false;
        }

        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                field.classList.add('error');
                return false;
            }
        }

        field.classList.remove('error');
        return true;
    }

    // Form submission handling
    contactForm.addEventListener('submit', (e) => {
        const formStatus = document.getElementById('form-status');
        const submitBtn = contactForm.querySelector('.btn');
        let isValid = true;

        // Validate all fields
        formInputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            e.preventDefault();
            formStatus.textContent = 'Please fill in all fields correctly.';
            formStatus.className = 'form-status error';
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';
    });
}

// Add glitch effect to elements with glitch class
document.querySelectorAll('.glitch').forEach(element => {
    element.addEventListener('mouseover', () => {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'glitch 1s infinite';
        }, 10);
    });
});

// Awards Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    const carouselCards = document.querySelectorAll('.award-carousel-card');
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    let currentIndex = 0;
    let autoplayInterval;

    function showCard(index) {
        // Remove active class from all cards and indicators
        carouselCards.forEach(card => card.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        // Add active class to current card and indicator
        if (carouselCards[index]) {
            carouselCards[index].classList.add('active');
        }
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }

        currentIndex = index;
    }

    function nextCard() {
        let nextIndex = (currentIndex + 1) % carouselCards.length;
        showCard(nextIndex);
    }

    function prevCard() {
        let prevIndex = (currentIndex - 1 + carouselCards.length) % carouselCards.length;
        showCard(prevIndex);
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextCard, 5000);
    }

    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    // Event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoplay();
            prevCard();
            startAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoplay();
            nextCard();
            startAutoplay();
        });
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            stopAutoplay();
            showCard(index);
            startAutoplay();
        });
    });

    // Start autoplay if carousel exists
    if (carouselCards.length > 0) {
        startAutoplay();
    }
});

// Interactive Timeline for Experience Page
document.addEventListener('DOMContentLoaded', () => {
    const experienceCards = document.querySelectorAll('.experience-card');

    if (experienceCards.length === 0) return;

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('in-view');
            });
        }, observerOptions)
        : null;

    // Observe all experience cards
    experienceCards.forEach((card, index) => {
        if (observer) observer.observe(card);
        else card.classList.add('in-view');

        // Add interactive hover effects
        card.addEventListener('mouseenter', () => {
            // Highlight the current card
            card.style.borderColor = 'var(--accent-color)';

            // Dim other cards slightly
            experienceCards.forEach((otherCard, otherIndex) => {
                if (otherIndex !== index) {
                    otherCard.style.opacity = '0.6';
                    otherCard.style.filter = 'blur(0.5px)';
                }
            });
        });

        card.addEventListener('mouseleave', () => {
            // Reset all cards
            experienceCards.forEach((otherCard) => {
                otherCard.style.opacity = '1';
                otherCard.style.filter = 'blur(0px)';
                otherCard.style.borderColor = 'var(--primary-color)';
            });
        });

        // Add click to expand/collapse details
        card.addEventListener('click', event => {
            if (event.target.closest('a, button')) return;
            card.classList.toggle('expanded');

            // Smooth scroll to card
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Add smooth scroll behavior to the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
});

function initCardDetailModal({
    modalId,
    cardSelector,
    closeSelector,
    fallbackLabel,
    renderContent
}) {
    const modal = document.getElementById(modalId);
    const cards = document.querySelectorAll(cardSelector);
    if (!modal || cards.length === 0) return;

    const modalTitle = modal.querySelector('h2');
    const closeButton = modal.querySelector('.detail-modal-close');
    let lastFocusedElement = null;

    const openModal = card => {
        lastFocusedElement = document.activeElement;
        modalTitle.textContent = card.querySelector('h3')?.textContent.trim() || '';
        renderContent(card, modal);
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeButton?.focus();
    };

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus();
        }
    };

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.trim() || fallbackLabel;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${title}`);
        card.addEventListener('click', event => {
            if (event.target.closest('a, button')) return;
            openModal(card);
        });
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openModal(card);
        });
    });

    modal.querySelectorAll(closeSelector).forEach(element => {
        element.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCardDetailModal({
        modalId: 'researchModal',
        cardSelector: '.research-card',
        closeSelector: '[data-research-modal-close]',
        fallbackLabel: 'research paper',
        renderContent: (card, modal) => {
            const date = card.querySelector('.research-date')?.cloneNode(true);
            const description = card.querySelector('.research-description')?.textContent.trim() || '';
            modal.querySelector('#researchModalDate').replaceChildren(...(date ? date.childNodes : []));
            modal.querySelector('#researchModalDescription').textContent = description;
            modal.querySelector('#researchModalMeta').replaceChildren(
                ...Array.from(card.querySelectorAll('.research-meta > *')).map(item => item.cloneNode(true))
            );
            modal.querySelector('#researchModalLinks').replaceChildren(
                ...Array.from(card.querySelectorAll('.research-links > *')).map(item => item.cloneNode(true))
            );
        }
    });

    initCardDetailModal({
        modalId: 'projectModal',
        cardSelector: '.project-card',
        closeSelector: '[data-project-modal-close]',
        fallbackLabel: 'project',
        renderContent: (card, modal) => {
            modal.querySelector('#projectModalDescription').replaceChildren(
                ...Array.from(card.querySelectorAll(':scope > p')).map(item => item.cloneNode(true))
            );
            modal.querySelector('#projectModalTech').replaceChildren(
                ...Array.from(card.querySelectorAll('.project-tech > *')).map(item => item.cloneNode(true))
            );
            modal.querySelector('#projectModalLinks').replaceChildren(
                ...Array.from(card.querySelectorAll('.project-links > *')).map(item => item.cloneNode(true))
            );
        }
    });
});
