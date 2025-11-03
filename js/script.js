// Matrix Rain Effect
const canvas = document.getElementById('matrixRain');
if (canvas) {
    const ctx = canvas.getContext('2d');

    // Set canvas size to window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Initial resize
    resizeCanvas();

    // Resize canvas when window is resized
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    // Draw the matrix rain
    function drawMatrixRain() {
        // Semi-transparent black background to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Green text
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        // Draw characters
        for (let i = 0; i < drops.length; i++) {
            // Random character
            const char = charArray[Math.floor(Math.random() * charArray.length)];
            
            // Draw the character
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);

            // Reset drop to top with random delay if it's at the bottom
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            // Move drop
            drops[i]++;
        }
    }

    // Animation loop
    function animate() {
        drawMatrixRain();
        requestAnimationFrame(animate);
    }

    // Start animation
    animate();
}



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
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize terminal effect
document.addEventListener('DOMContentLoaded', () => {
    // Initialize system terminal on home page
    const systemTerminal = document.querySelector('.terminal-window .terminal-content');
    if (systemTerminal) {
        const terminalTexts = systemTerminal.querySelectorAll('.typing-text');
        terminalTexts.forEach((text, index) => {
            const originalText = text.textContent;
            text.textContent = ''; // Clear the text before starting animation
            setTimeout(() => {
                new TypingEffect(text, originalText, 50);
            }, index * 1000); // Stagger the start of each line
        });
    }

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

// Terminal text animation
document.addEventListener('DOMContentLoaded', function() {
    const typingTexts = document.querySelectorAll('.typing-text');

    typingTexts.forEach(text => {
        const delay = text.getAttribute('data-delay');
        text.style.setProperty('--delay', delay);
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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Add a subtle glow effect when card comes into view
                entry.target.style.boxShadow = '0 12px 32px rgba(0, 255, 0, 0.15)';
            }
        });
    }, observerOptions);

    // Observe all experience cards
    experienceCards.forEach((card, index) => {
        observer.observe(card);

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
        card.addEventListener('click', () => {
            card.classList.toggle('expanded');

            // Smooth scroll to card
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Add smooth scroll behavior to the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
});

// Add CSS for expanded state
const style = document.createElement('style');
style.textContent = `
    .experience-card.expanded {
        transform: scale(1.02);
        box-shadow: 0 16px 40px rgba(0, 255, 0, 0.25) !important;
    }

    .experience-card.in-view {
        animation: none;
    }
`;
document.head.appendChild(style);