// Matrix Rain Effect
const canvas = document.getElementById('matrixRain');
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

// Characters to use in the rain
const chars = '0123456789ABCDEF';
const charSize = 14;
const columns = canvas.width / charSize;
const drops = [];

// Initialize drops
for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * -canvas.height);
}

// Draw the rain
function draw() {
    // Semi-transparent black background to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = '#0F0';
    ctx.font = charSize + 'px monospace';

    // Draw each drop
    for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Draw the character
        const x = i * charSize;
        const y = drops[i] * charSize;
        
        // Vary the opacity based on position
        const opacity = Math.random() * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
        ctx.fillText(char, x, y);

        // Reset drop to top when it reaches bottom
        if (y > canvas.height) {
            drops[i] = 0;
        }
        
        // Move drop down
        drops[i]++;
    }
}

// Animate
function animate() {
    draw();
    requestAnimationFrame(animate);
}

// Start animation
animate();

// Existing mobile navigation code
document.querySelector('.mobile-nav-toggle').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    if (!nav.contains(event.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
});

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