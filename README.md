# Nikhill Vombatkere - Portfolio Website

Visit my portfolio: [nvombat.github.io](https://nvombat.github.io/)

## Overview

A professional portfolio website showcasing my academic research, projects, and professional experience in cybersecurity and access control.

## Features

- **Responsive Design** - Works seamlessly on all devices
- **Dark/Light Theme** - Toggle between dark and light modes with localStorage persistence
- **Matrix Rain Animation** - Cyberpunk-themed background effect with toggle
- **Interactive Elements** - Terminal-style sections and smooth animations
- **Research Showcase** - Publications with consistent card layouts and aligned metadata
- **Project Portfolio** - Featured projects with tech tags and repository links
- **Professional Timeline** - Interactive experience timeline with staggered animations
- **Awards Carousel** - Interactive carousel showcasing academic awards
- **Academic Leadership** - Teaching, committee service, and leadership initiatives
- **Contact Form** - Integrated contact form via Formspree

## Pages

- **Home** - Introduction, bio, education, awards carousel, and contact form
- **Experience** - Professional experience timeline, teaching roles, committee service, and leadership initiatives
- **Research** - Academic research publications with areas of research in terminal section
- **Projects** - Featured projects with tech tags and GitHub repository links

## Design & Layout

### Card Layouts
- **Research Cards** - Flexbox-based layout with fixed title space (100px), flexible description area, and auto-aligned metadata at bottom
- **Project Cards** - Consistent layout with fixed title space (60px), flexible descriptions, and tech tags pushed to bottom
- **Leadership Cards** - Uniform bullet point styling with consistent indentation across all subsections

### Typography & Styling
- **Bullet Points** - Custom styled bullet points (▸) with consistent indentation (1.5rem)
- **Text Truncation** - Research titles limited to 3 lines, project titles to 2 lines
- **Responsive Typography** - Font sizes and spacing adjust for mobile devices

### Interactive Features
- **Hover Effects** - Cards lift and glow on hover with smooth transitions
- **Animations** - Staggered load animations, carousel transitions, and typing effects
- **Theme Persistence** - User preferences saved to localStorage

## Technologies

- HTML5
- CSS3 (with CSS variables for theming, flexbox layouts, and animations)
- Vanilla JavaScript (DOM manipulation, localStorage, event handling)
- Font Awesome Icons
- Formspree (contact form backend)

## World Cup Prediction Game

The prediction page is at `pages/predworldcup.html`.

- Production uses the Railway backend URL from the page's `backend-url` meta tag.
- When served from `localhost`, `127.0.0.1`, or `0.0.0.0`, it automatically
  uses the local backend on port `5001`.
- The Admin footer link follows the same environment selection.

Local startup:

```bash
# Backend repository
npm run dev

# This frontend repository
python3 -m http.server 8000
```

Open `http://localhost:8000/pages/predworldcup.html`. The local admin panel is
`http://localhost:5001/admin`.
