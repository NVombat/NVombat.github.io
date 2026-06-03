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
- **Predictions** - World Cup prediction game with leaderboard and scoring system

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

## World Cup Prediction Game

The **Predictions** page (`/pages/predworldcup.html`) is an interactive game where players can:

- **Submit Predictions**: Select 8 teams (2 Round of 32, 2 Round of 16, 1 Quarter-final, 1 Semi-final, 1 Final, 1 Winner)
- **Avoid Duplicates**: Same team cannot be selected twice in one entry
- **Score Points**: Earn points based on how far teams actually progress
- **View Leaderboard**: See rankings after June 12, 2026 12:30 AM IST deadline
- **Live Updates**: Scores automatically recalculate as tournament results are entered

### Scoring System
| Stage | Points |
|---|---:|
| Round of 32 | 1 |
| Round of 16 | 3 |
| Quarter-final | 6 |
| Semi-final | 10 |
| Final | 15 |
| Winner | 22 |

**Maximum Score**: 61 points

### Key Features
- **Countdown Timer**: Shows time remaining until deadline
- **Privacy Lock**: Entries hidden before tournament starts
- **Form Validation**: Real-time validation with error messages
- **LocalStorage**: Predictions stored locally (ready for backend integration)
- **Responsive Tables**: Leaderboard and predictions table work on all devices
- **Admin Updates**: Easy result updates for tournament progress

## Technologies

- HTML5
- CSS3 (with CSS variables for theming, flexbox layouts, and animations)
- Vanilla JavaScript (DOM manipulation, localStorage, event handling, countdown timers)
- Font Awesome Icons
- Formspree (contact form backend)