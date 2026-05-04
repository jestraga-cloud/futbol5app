# ⚽ Futbol 5 App

A progressive web app (PWA) for tracking and managing 5-a-side football matches between friends. Keep detailed statistics, generate balanced teams, vote for MVPs, and share results with your group.

## Features

- 📊 **Player Statistics & Rankings** - Track win rates, goals, and performance metrics
- 🎯 **Match Management** - Register matches, scorelines, and player participation
- 👥 **Smart Team Generation** - Automatically generate balanced teams based on player stats
- 🏆 **MVP Voting** - Vote for the best player of each match
- 🎮 **FIFA Cards** - Gamified player cards with skill progression
- 📱 **PWA Support** - Works offline, installable on any device
- 🌙 **Dark Mode** - Eye-friendly dark theme with light mode alternative
- 📤 **WhatsApp Sharing** - Share match results directly to WhatsApp
- 🔐 **Admin Panel** - Secure admin features with PIN protection
- 🌍 **Multi-language** - Built with Spanish localization

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [PostCSS](https://postcss.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Integration**: [OpenAI API](https://openai.com/api/) for smart suggestions
- **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **PWA**: [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa)
- **Testing**: [Vitest](https://vitest.dev/)
- **UI Components**: React 19 with custom components

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account with a PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jestraga-cloud/futbol5app.git
   cd futbol5app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ADMIN_PIN=your_secure_pin
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

```bash
# Development with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm lint

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
futbol5-app/
├── app/              # Next.js App Router pages
├── components/       # React components (UI elements)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and helpers
├── public/          # Static assets and PWA manifest
├── scripts/         # Database seed scripts
└── styles/          # Global CSS styles
```

## Key Components

- **RankingTable** - Displays player rankings and statistics
- **GenerarEquipos** - Intelligent team generation algorithm
- **VotarMVP** - MVP voting interface
- **FifaCard** - Gamified player profile cards
- **DashboardStats** - Key metrics and insights
- **AdminLogin** - Secure admin access

## Database

The app uses Supabase PostgreSQL with the following main tables:
- `jugadores` - Player profiles
- `partidos` - Match records
- `resultados_equipos` - Team results
- `predicciones` - MVP predictions/voting

See `supabase-predicciones.sql` for the full database schema.

## Deployment

The app is configured for easy deployment on [Vercel](https://vercel.com/):

```bash
# Deploy to Vercel
vercel deploy
```

## Security

- API keys and sensitive data are stored in `.env.local` (never committed to git)
- Admin features are protected with PIN authentication
- All sensitive files are listed in `.gitignore`

## Contributing

Feel free to fork and submit pull requests for any improvements.

## License

ISC

## Author

Jairo Straga

---

**Built with ❤️ for football lovers everywhere**
