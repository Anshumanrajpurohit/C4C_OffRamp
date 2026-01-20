# C4C OffRamp: Plant-Based Transition Platform

**C4C OffRamp** is a modern web platform designed to help non-vegetarian and flexitarian users **transition toward plant-based eating through practical food substitutions**, not restriction. Instead of generic vegan recipes, OffRamp acts as a behavioral “off-ramp” by mapping familiar non-vegetarian dishes to culturally appropriate plant-based alternatives that preserve taste, texture, and cooking style.

The platform is built to be **white-label and partner-ready**, enabling NGOs, universities, sustainability groups, and community organizations to deploy it as part of awareness, outreach, or behavior-change campaigns.

---

## 🌱 Core Capabilities

* **Dish-to-Dish Substitution Engine**
  Suggests plant-based alternatives for common non-veg dishes using structured replacement logic (e.g., chicken → soya chunks, jackfruit).

* **Cultural & Regional Context**
  Alternatives are grounded in Indian regional cuisines to ensure familiarity and adoption.

* **Guided Explanations**
  AI-assisted explanations describe *why* a substitution works, focusing on taste, texture, nutrition, and cooking method.

* **Impact Awareness (Non-Inflated)**
  Displays indicative environmental and animal-impact metrics to reinforce positive behavior without exaggeration.

* **User Accounts & Preferences**
  Authentication via Supabase with user profiles, saved dishes, and dietary constraints.

* **Responsive, Accessible UI**
  Optimized for mobile and desktop to support outreach campaigns and community usage.

* **Partner-Ready Architecture**
  Designed for white-label deployment and NGO-led distribution rather than ad-driven growth.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14, React 18, TypeScript
* **Styling**: Tailwind CSS
* **Backend & Auth**: Supabase (PostgreSQL, Auth, RLS)
* **AI Layer**: LLM-assisted explanations with rule-based fallbacks
* **Deployment**: Vercel
* **Tooling**: GitHub, ESLint, PostCSS

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* Supabase account & project

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Anshumanrajpurohit/C4C_OffRamp.git
   cd C4C_OffRamp/offramp
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure environment variables

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase
   Follow instructions in `SUPABASE_SETUP.md` to configure tables and Row Level Security policies.

5. Run the app

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
C4C_OffRamp/
├── offramp/
│   ├── app/              # App Router pages & APIs
│   ├── lib/              # Dish catalog, utilities, Supabase client
│   ├── public/           # Static assets
│   ├── SUPABASE_SETUP.md # Database setup
│   └── package.json
└── README.md
```

---

## 🧠 Key Design Principles

* **Behavior Change over Ideology**
  Focus on substitutions, not enforcement or guilt.

* **Trust & Transparency**
  Clear data sources, explainable recommendations, and conservative impact metrics.

* **Partner-Led Distribution**
  Built for NGOs and institutions to deploy, not for ad-driven consumer growth.

---

## 🌐 Deployment

The app is optimized for Vercel deployment.

1. Connect the GitHub repo to Vercel
2. Add environment variables
3. Auto-deploy on main branch pushes

**Live Demo**: [https://c4-c-off-ramp.vercel.app](https://c4-c-off-ramp.vercel.app)

---

## 🤝 Contributing

This project is part of **Code for Compassion** initiatives.

To contribute:

1. Fork the repo
2. Create a feature branch
3. Commit with clear messages
4. Open a Pull Request

### Adding New Dish Swaps

* Update `lib/dishes.ts`
* Ensure cultural accuracy and clear substitution logic
* Avoid exaggerated health or impact claims

---

## 📄 License

MIT License. See `LICENSE` for details.

---

## 🙏 Acknowledgments

* Built for **Code for Compassion (C4C)**
* Inspired by sustainable food systems and behavioral design
* Thanks to organizers, mentors, and contributors

---

**Built to reduce friction, not choices.
Technology as an off-ramp, not a lecture.**

---
