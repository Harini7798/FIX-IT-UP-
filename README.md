# 🛠️ FixItUp

FixItUp is a modern web application designed for college campuses, enabling students to fix, reuse, and repair their electronics in an eco-friendly fashion. By connecting students with local student repairers ("Fixers"), FixItUp aims to reduce e-waste, save money, and promote a sustainable, circular economy.

---

## 🚀 Key Features

- **🛠️ Fixer Marketplace**: Discover and connect with fellow student repair experts (Fixers) on campus or register to become one.
- **📦 Electronics Listing**: Post broken, unused, or fully functional electronics for repair, trade, or donation.
- **💬 Real-Time Chat**: Integrated messaging system allowing users and fixers to coordinate repairs and terms safely.
- **📊 Unified Dashboard**: Track your listings, active repair requests, messages, and profile statistics from one place.
- **🔒 Secure Authentication**: Robust user authentication and database access powered by Supabase.
- **🎨 Modern & Responsive UI**: Clean interface built with Tailwind CSS, Shadcn UI, and dark mode optimizations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **State & Data Fetching**: [TanStack React Query](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend & Database
- **Provider**: [Supabase](https://supabase.com/) (Auth, PostgreSQL Database, Real-time APIs)

---

## ⚙️ Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
Make sure you have Node.js installed. You can use either **npm** or **bun** as your package manager.

### 1. Clone the Repository
```bash
git clone https://github.com/Harini7798/FIX-IT-UP.git
cd FixItUp
```

### 2. Install Dependencies
Using **npm**:
```bash
npm install
```
Using **bun**:
```bash
bun install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 4. Live Deployment
The application is deployed on Vercel and can be accessed live at:
👉 **[fix-it-up.vercel.app](https://fix-it-up.vercel.app/)**

---

## 📂 Project Structure

```text
FixItUp/
├── src/
│   ├── assets/          # Static assets & images
│   ├── components/      # Shared React components (Navigation, Hero, Features, etc.)
│   ├── hooks/           # Custom React hooks (useAuth, etc.)
│   ├── integrations/    # External clients (Supabase connection & types)
│   ├── lib/             # Helper libraries & utility functions
│   ├── pages/           # Page components (Index, Auth, Browse, Dashboard, Shop, etc.)
│   ├── App.tsx          # Main application routing configuration
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global CSS & Tailwind imports
├── supabase/            # Supabase configuration & migrations
├── package.json         # Project dependencies and npm scripts
└── tsconfig.json        # TypeScript configuration
```

---

## ♻️ Eco-Impact
Every electronic device repaired or reused keeps harmful heavy metals out of landfills and reduces the demand for new mining resources. Join us in making campus life greener, one fix at a time! 🌍
