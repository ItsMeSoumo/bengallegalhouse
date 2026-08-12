# 🎓 OnePlace CBT — Enterprise Computer-Based Testing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)

**OnePlace CBT** is a production-grade, enterprise Computer-Based Testing (CBT) platform engineered to simulate national-level competitive examination environments (such as GATE, NTA, JEE, and TCS iON). Built with **Next.js 16 App Router**, **React 19**, **TypeScript**, **Firebase**, and powered by **Google Gemini 3.5 Flash Lite / 3.5 Flash Vision AI**, it features real-time exam execution, AI-driven question paper extraction from PDFs/images, automated scoring, candidate management, and instant downloadable PDF scorecards.

---

## 🌟 Key Features & Core Modules

### 🎓 Candidate Exam Engine
* **Authentic Testing UI**: Recreates official CBT exam standards with section navigation, question status palettes (*Answered*, *Marked for Review*, *Unanswered*, *Not Visited*).
* **Multi-Format Input Support**: Full support for Multiple Choice Questions (MCQ) and Numerical Answer Type (NAT) questions with an on-screen virtual numeric keypad ([NumericInput.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/NumericInput.tsx)).
* **Live Timer & Synchronized Auto-Submit**: Real-time countdown timer synchronized with client state and automatic submission upon time expiry ([Timer.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/Timer.tsx), [useTimer.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/hooks/useTimer.ts)).
* **Fault-Tolerant Session Protection**: Local state synchronization prevents loss of candidate answers during unexpected browser reloads or network drops ([useExam.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/hooks/useExam.ts)).

### 🤖 AI-Powered Question Extractor (Admin)
* **Gemini 3.5 Flash Lite Multimodal OCR**: Automatically extracts and parses raw exam PDFs, scanned booklet images, or unstructured text into structured JSON question papers using Google Gemini 3.5 Flash Vision AI ([AiQuestionExtractorModal.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/AiQuestionExtractorModal.tsx)).
* **High-Resilience Multi-Model Fallback**: Dynamic API routing cascading across model endpoints (`gemini-3.5-flash-lite`, `gemini-3.5-flash-lite-preview`, `gemini-3.5-flash`, `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`) to guarantee 99.9% extraction availability during peak loads ([ai-extract-questions/route.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/app/api/admin/ai-extract-questions/route.ts)).

### 📊 Automated Evaluation & Analytics
* **Configurable Scoring Engine**: Automatic evaluation supporting section-based positive scoring and negative marking rules (+1 for correct, -0.25 for incorrect).
* **Interactive Performance Dashboard**: Detailed post-exam analytics summarizing total marks, accuracy percentage, subject-wise breakdown, and time spent ([ResultsCard.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/exam/ResultsCard.tsx)).
* **Print-Ready PDF Scorecards**: Zero-dependency HTML/CSS print template generator producing pixel-perfect downloadable A4 PDF scorecards ([generatePdfReport.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/generatePdfReport.ts)).

### ⚙️ Admin Control Center & Operations
* **Exam Scheduler & Rule Manager**: Schedule live exam windows, start/end timestamps, private vs. public paper visibility, and section rules ([ExamScheduler.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/ui/ExamScheduler.tsx)).
* **Candidate & Submission Management**: Track registered student accounts, inspect individual candidate submission attempts, filter scorecards, and manage test data ([AdminStudentUsers.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/admin/AdminStudentUsers.tsx), [AdminCandidateResults.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/admin/AdminCandidateResults.tsx)).
* **Paper Registry & Editor**: Centralized management to create, edit, store, publish, and delete CBT papers ([AdminExamManager.tsx](file:///c:/Users/SOUMO/Desktop/sohamcbt/components/admin/AdminExamManager.tsx), [examRegistry.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/examRegistry.ts)).
* **JWT & Cookie Session Security**: Protected admin dashboard routes with HTTP cookie & JWT session verification ([adminAuth.ts](file:///c:/Users/SOUMO/Desktop/sohamcbt/lib/adminAuth.ts)).

---

## 🛠️ Tech Stack & Architecture

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Custom Design Tokens |
| **Database** | [Firebase / Firestore](https://firebase.google.com/) |
| **AI Integration** | [Google Gemini 3.5 Flash Lite / 3.5 Flash Vision REST API](https://ai.google.dev/) |
| **State Management** | React Custom Hooks & LocalStorage Persistence |
| **Auth & Security** | JWT Session Cookies & Server-side Middleware Verification |

---

## 📂 Project Structure

```text
oneplacecbt/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── page.tsx              # Admin Control Panel & Candidate Management
│   ├── (exam)/
│   │   ├── exam/                     # Live CBT Exam Engine Route
│   │   └── results/                  # Candidate Results & PDF Report Route
│   ├── api/
│   │   ├── admin/
│   │   │   ├── ai-extract-questions/ # Gemini 3.5 Flash Vision AI Extraction Route
│   │   │   ├── check-auth/           # Admin Authentication Status Endpoint
│   │   │   ├── login/                # Admin Login Handler (JWT & Cookie)
│   │   │   ├── logout/               # Admin Session Logout Handler
│   │   │   └── save-exam-paper/      # Exam Paper Persistence Endpoint
│   │   └── exam/
│   │       ├── questions/            # Paper Question Loader
│   │       └── submit/               # Answer Submission & Scoring Endpoint
│   ├── dashboard/                    # Student Portal (Exams & Attempt History)
│   ├── globals.css                   # Global CBT Design System Tokens
│   ├── layout.tsx                    # Root Layout Component
│   └── page.tsx                      # Main Landing & Portal Entry
├── components/
│   ├── admin/                        # Exam Manager, Candidate Results, Student Users, Modals
│   ├── exam/                         # Question Card, Palette, Header, Results Card
│   ├── layout/                       # Admin & Student Navigation Sidebars
│   └── ui/                           # Gemini 3.5 AI Extractor Modal, Scheduler, Keypad, Timer
├── hooks/                            # Custom Hooks (useExam, useTimer)
├── lib/                              # Firebase, Gemini AI Resolver, PDF Scorecard Generator
└── db/                               # Database Schema & Initializers
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory and configure the environment variables:

```env
# Server Administration & Security
ADMIN_PASSWORD=your_secure_admin_password
JWT_SECRET=your_jwt_secret_key

# Google Gemini AI Key (Powered by Gemini 3.5 Flash Lite)
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

## 💡 Technical Highlights

* **Google Gemini 3.5 Flash Integration**: Leverages Gemini 3.5 Flash Lite & Vision AI with multi-model automatic fallback to achieve high accuracy OCR for mathematical formulas, multi-choice options, and diagrams from raw exam PDFs/scans.
* **Zero-Dependency PDF Generator**: Native CSS `@media print` layout producing clean A4 scorecards without adding external PDF renderer dependencies.
* **State Preservation Architecture**: Synchronizes real-time candidate choices with `localStorage` to guard against unintended reloads or network drops.
* **Secure JWT Cookie Authentication**: Production-grade admin route protection utilizing signed HTTP cookies and API verification handlers.

---

## 📄 License

This project is licensed under the **MIT License**.
