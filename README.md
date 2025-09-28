# QuestKit

Real-time, gamified task & habit "questing" for families and small teams.

## 🎯 Overview

QuestKit transforms mundane chores and family to-dos into engaging quests with:
- **Streaks & XP**: Track progress and build momentum
- **Photo Verification**: Prove quest completion with pictures
- **Rewards System**: Earn coins and redeem family rewards
- **Real-time Updates**: Live notifications and family activity feed
- **Family Management**: Role-based permissions and settings

## 🚀 Features

### For Families
- **Quest Creation**: Parents and children can create tasks
- **Progress Tracking**: Visual progress bars and achievement badges  
- **Streak System**: Build habits with daily streak counters
- **Photo Verification**: Optional photo proof for quest completion
- **Reward Store**: Custom family rewards redeemable with earned coins
- **Real-time Activity**: Live updates when family members complete quests

### For Teams
- **Role Management**: Parent/Child/Admin permissions
- **Family Settings**: Customizable rules and XP multipliers
- **Leaderboards**: Friendly competition with XP rankings
- **Analytics**: Track completion rates and family progress

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** with **Prisma ORM**
- **Socket.io** for real-time features
- **JWT Authentication** with refresh tokens
- **bcrypt** for password hashing
- **Rate limiting** and security middleware

### Frontend  
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Zustand** for state management
- **Socket.io Client** for real-time updates
- **React Hook Form** for form handling

### Development
- **Monorepo** structure with workspaces
- **Shared TypeScript** types package
- **ESLint** + **Prettier** for code quality
- **Jest** for testing

## 🏗️ Project Structure

```
QuestKit/
├── apps/
│   ├── server/          # Node.js backend API
│   │   ├── src/
│   │   │   ├── routes/  # API routes
│   │   │   ├── services/# Business logic
│   │   │   ├── middleware/
│   │   │   └── ...
│   │   ├── prisma/      # Database schema
│   │   └── ...
│   └── client/          # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── stores/
│       │   ├── services/
│       │   └── ...
│       └── ...
└── packages/
    └── shared/          # Shared TypeScript types
        └── src/types/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/easyonthesauce/QuestKit.git
   cd QuestKit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In apps/server/
   cp .env.example .env
   # Edit .env with your database URL and JWT secrets
   ```

4. **Set up the database**
   ```bash
   cd apps/server
   npx prisma generate
   npx prisma db push
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This starts both:
   - Backend API server on `http://localhost:3001`
   - Frontend development server on `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm test` - Run tests across all packages
- `npm run lint` - Lint all code
- `npm run setup` - Install dependencies and set up database

## 🎮 Usage

### Creating Your First Family

1. **Register** a new account
2. **Create a family** or join with an invite code
3. **Set up family settings** (permissions, XP multipliers, etc.)
4. **Create your first quest** and start earning XP!

### Quest Types

- **Easy** (🟢): 10-25 XP - Simple daily tasks
- **Medium** (🟡): 30-60 XP - Regular chores  
- **Hard** (🟠): 70-100 XP - Complex projects
- **Epic** (🟣): 120+ XP - Major achievements

### Gamification Elements

- **XP & Levels**: Gain experience and level up
- **Streaks**: Build momentum with consecutive daily completions
- **Coins**: Earn currency to spend in the family reward store
- **Achievements**: Unlock badges for milestones
- **Leaderboards**: Family rankings and friendly competition

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies for scalability and performance
- Inspired by gamification principles and family productivity needs
- Designed for real-world family dynamics and team collaboration