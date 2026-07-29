# Nikhill Vombatkere - Portfolio Website

Visit my portfolio: [nvombat.github.io](https://nvombat.github.io/)

## Overview

A professional portfolio website showcasing my academic research, projects, and professional experience in cybersecurity and access control.

## Features

- **Responsive Design** - Works seamlessly on all devices
- **Dark/Light Theme** - Toggle between dark and light modes with localStorage persistence
- **Matrix Rain Animation** - Cyberpunk-themed background effect with toggle
- **Interactive Elements** - Terminal-style sections and smooth animations
- **Research Showcase** - Publication cards with paper metadata and detail modals
- **Project Portfolio** - Project cards with repository links and detail modals
- **Professional Timeline** - Interactive experience timeline with staggered animations
- **Awards Carousel** - Interactive carousel showcasing academic awards
- **Academic Leadership** - Teaching, committee service, and leadership initiatives
- **Contact Form** - Integrated contact form via Formspree

## Pages

- **Home** - Introduction, bio, education, awards carousel, and contact form
- **Experience** - Professional experience timeline, teaching roles, committee service, and leadership initiatives
- **Research** - Academic research publications with areas of research in terminal section
- **Projects** - Featured projects with tech tags and GitHub repository links
- **$TEAK** - Prediction hub with WCPrediction and PLPrediction entry points

## Design & Layout

### Card Layouts
- **Research Cards** - Show the paper title, date, conference/status tags, and paper link; clicking a card opens its existing description
- **Project Cards** - Show the project name, technology tags, and repository link; clicking a card opens its existing description
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

## $TEAK Prediction Hub

The prediction hub is at `pages/steak.html` and is displayed in the site nav as
`$TEAK`. From there, users choose between WCPrediction and PLPrediction.

- WCPrediction lives at `pages/predworldcup.html` and currently shows the
  WC2026 archive/results plus the WC2030 stay-tuned note. WC2026 results are
  loaded from `/api/archives/world-cup/2026`; its archive payload includes the
  rules that applied to WC2026. The archive view fails closed if that complete
  payload is unavailable and does not reconstruct history from live-game
  endpoints.
- PLPrediction lives at `pages/plprediction.html` and is ready for the
  PL2026-2027 current game, FPL-backed team/player selections, post-kickoff
  leaderboard, live table, Gameweek 19 update window, and future PL archives.
  Golden Boot, Golden Glove, and Player of the Season selections provide
  searchable player menus. The live rules are loaded from the season record
  rather than duplicated in the frontend. Each completed PL archive preserves
  that season's database-backed rules, original and updated predictions,
  midpoint/final tables, scores, and results.

- WCPrediction uses the Railway backend URL from its `backend-url` meta tag.
- When WCPrediction is served from `localhost`, `127.0.0.1`, or `0.0.0.0`, it
  automatically uses the local backend on port `5001`.
- The WCPrediction Admin footer link follows the same environment selection.
- `$TEAK` is static and only links to prediction pages. Both game pages call
  the shared Railway backend, and both select the local backend on port `5001`
  when served from localhost.

Local startup:

```bash
# Backend repository
npm run dev

# This frontend repository
python3 -m http.server 8000
```

Open `http://localhost:8000/pages/steak.html`. The local WCPrediction page is
`http://localhost:8000/pages/predworldcup.html`, PLPrediction is
`http://localhost:8000/pages/plprediction.html`, and the local admin panel is
`http://localhost:5001/admin`.
