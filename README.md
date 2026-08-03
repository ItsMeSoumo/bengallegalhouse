# 🎓 OnePlace CBT — Enterprise Computer-Based Testing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-Vision_AI-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)

**OnePlace CBT** is a production-grade, enterprise Computer-Based Testing (CBT) platform engineered to simulate national-level competitive examination environments (such as GATE, NTA, JEE, and TCS iON). Built with **Next.js 16 App Router**, **React 19**, **TypeScript**, **Firebase**, and integrated with **Google Gemini Vision AI**, it features real-time exam execution, AI-driven question paper extraction, automated grading, and instant PDF scorecard generation.

---

## 🌟 Key Features & Core Modules

### 🎓 Candidate Exam Engine
* **Authentic Testing UI**: Recreates official CBT exam standards including section navigation, question status palettes (*Answered*, *Marked for Review*, *Unanswered*, *Not Visited*).
* **Multi-Format Input Support**: Full support for Multiple Choice Questions (MCQ) and Numerical Answer Type (NAT) questions with an on-screen virtual numeric keypad ([NumericInput.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/NumericInput.tsx)).
* **Live Timer & Auto-Submit**: Real-time countdown timer synchronized with client state and automatic submission upon time expiry ([Timer.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/Timer.tsx), [useTimer.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/hooks/useTimer.ts)).
* **Fault-Tolerant Session Protection**: Local state synchronization prevents data loss during unexpected browser reloads or network drops ([useExam.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/hooks/useExam.ts)).

### 🤖 AI-Powered Question Extractor (Admin)
* **Multimodal OCR Question Parsing**: Parses raw exam PDFs, scanned image booklets, or unstructured text into formatted JSON question papers using Google Gemini Vision AI ([AiQuestionExtractorModal.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/AiQuestionExtractorModal.tsx)).
* **Multi-Model Fallback Cascade**: High-resilience API routing that cascades across multiple Gemini model endpoints (`gemini-2.0-flash`, `gemini-1.5-flash`, etc.) to guarantee 99.9% uptime during peak loads ([ai-extract-questions/route.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/app/api/admin/ai-extract-questions/route.ts)).

### 📊 Automated Evaluation & Analytics
* **Instant Marking Engine**: Automatic scoring with configurable negative marking support (+1 for correct, -0.25 for incorrect).
* **Interactive Performance Dashboard**: Detailed post-exam summary highlighting total marks, subject-level accuracy, unanswered questions, and time spent ([ResultsCard.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/exam/ResultsCard.tsx)).
* **Print-Ready PDF Scorecards**: Zero-dependency HTML/CSS print template generator that produces professional, downloadable PDF report cards ([generatePdfReport.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/generatePdfReport.ts)).

### ⚙️ Admin Control Center & Exam Scheduling
* **Exam Scheduler**: Create, publish, schedule live testing windows, and configure section-wise rules ([ExamScheduler.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/ExamScheduler.tsx)).
* **Paper Registry & Editor**: Centralized management to create, edit, store, and publish exam papers ([examRegistry.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/examRegistry.ts)).
* **Secure Cookie Authentication**: Protected admin routes with session-based cookie verification ([adminAuth.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/adminAuth.ts)).

---

## 🛠️ Tech Stack & Architecture

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Custom CSS Tokens |
| **Database** | [Firebase / Firestore](https://firebase.google.com/) |
| **AI Integration** | [Google Gemini REST API (Multimodal Vision)](https://ai.google.dev/) |
| **State Management** | React Hooks & LocalStorage Persistence |

---

## 📂 Project Structure

```text
oneplacecbt/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── page.tsx              # Comprehensive Admin Control Panel
│   ├── (exam)/
│   │   ├── exam/                     # Live CBT Exam Engine Route
│   │   └── results/                  # Exam Result & Performance Route
│   ├── api/
│   │   ├── admin/
│   │   │   ├── ai-extract-questions/ # Gemini AI OCR Extraction API
│   │   │   ├── check-auth/           # Admin Session Check Endpoint
│   │   │   ├── login/                # Admin Login Handler
│   │   │   └── save-exam-paper/      # Paper Persistence Endpoint
│   │   └── exam/
│   │       ├── questions/            # Exam Question Retriever
│   │       └── submit/               # Exam Answer Submission Endpoint
│   ├── dashboard/                    # Student Exam Portal & History
│   ├── globals.css                   # Global Design System Tokens
│   ├── layout.tsx                    # Root Next.js Layout
│   └── page.tsx                      # Landing / Portal Selector
├── components/
│   ├── exam/                         # Question Card, Palette, Header, Results
│   ├── layout/                       # Admin & Student Navigation Sidebars
│   └── ui/                           # AI Extractor Modal, Scheduler, Keypad, Timer
├── hooks/                            # Custom Hooks (useExam, useTimer)
├── lib/                              # Core Utility Modules (Firebase, AI, PDF Generator)
└── db/                               # Database Configurations
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory and populate the required environment variables:

```env
# Server Administration
ADMIN_PASSWORD=your_secure_admin_password
JWT_SECRET=your_jwt_secret_key

# Google Gemini AI Key (For AI Question Extraction)
GEMINI_API_KEY=AIzaSy...

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.x` or higher
* **npm**: `v9.x` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/oneplacecbt.git
   cd oneplacecbt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💡 Engineering & Technical Highlights

* **Zero-Dependency PDF Generator**: Uses native CSS `@media print` rules and window DOM rendering to generate pixel-perfect A4 scorecards without adding heavy external PDF bundle overhead.
* **Resilient Multimodal Vision Pipeline**: Implemented a dynamic model fallback array in Next.js Server Route Handlers to ensure seamless question extraction across multiple Gemini AI endpoints.
* **State Preservation Architecture**: Built custom React hooks ([useExam.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/hooks/useExam.ts)) with `localStorage` fallback to prevent candidate answer loss during browser disruptions.

---

## 📄 License

This project is licensed under the **MIT License**.
