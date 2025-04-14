// Matrix rain effect
class MatrixRain {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('matrix-bg');
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        this.init();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns).fill(1);
    }

    init() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0F0';
        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters[Math.floor(Math.random() * this.characters.length)];
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        requestAnimationFrame(() => this.init());
    }
}

// Typing effect for terminal
class TypingEffect {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.currentChar = 0;
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

// Terminal command simulation
class TerminalSimulator {
    constructor(element) {
        this.element = element;
        this.commands = [
            '> Initializing system...',
            '> Loading profile...',
            '> Scanning for vulnerabilities...',
            '> Access granted.',
            '> Welcome to NVombat.dev'
        ];
        this.currentCommand = 0;
        this.currentChar = 0;
        this.element.textContent = '';
        this.typeCommand();
    }

    typeCommand() {
        if (this.currentCommand < this.commands.length) {
            const command = this.commands[this.currentCommand];
            
            if (this.currentChar < command.length) {
                this.element.textContent += command.charAt(this.currentChar);
                this.currentChar++;
                setTimeout(() => this.typeCommand(), 50);
            } else {
                this.element.textContent += '\n';
                this.currentCommand++;
                this.currentChar = 0;
                setTimeout(() => this.typeCommand(), 500);
            }
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

// Initialize matrix effect
new MatrixRain();

// Initialize terminal effect
document.addEventListener('DOMContentLoaded', () => {
    const terminalText = document.querySelector('.typing-text');
    if (terminalText) {
        new TerminalSimulator(terminalText);
    }
});

// Form submission handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        // Add your form submission logic here
        console.log('Form submitted:', Object.fromEntries(formData));
        // Show success message
        alert('Message sent successfully!');
        contactForm.reset();
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

// Add hover effect to cards
document.querySelectorAll('.research-card, .project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
        card.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.3)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.2)';
    });
});

// Add cyber-link hover effect
document.querySelectorAll('.cyber-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
        link.style.textShadow = '0 0 5px var(--secondary-color)';
    });

    link.addEventListener('mouseleave', () => {
        link.style.textShadow = 'none';
    });
}); 