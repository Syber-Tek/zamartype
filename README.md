# Zamar⚡Type

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.8-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.6.1-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> A minimalist, high-performance, responsive web application for testing and improving typing speed and accuracy. Built with React 19, Vite, Tailwind CSS v4, and Lucide Icons.

---

## ⚡ Overview

**Zamar⚡Type** is a modern typing simulator inspired by minimalist typing platforms like Monkeytype. Designed for speed, precision, and a smooth user experience, Zamar⚡Type provides real-time feedback on Words Per Minute (WPM), typing accuracy, character correctness, and test timing.

Featuring tactile audio feedback, customizable test modes (**Time** and **Word count**), dynamic word scrolling, error tracking, and instant keyboard shortcuts, Zamar⚡Type helps users measure and hone their typing skills effortlessly.

---

## ✨ Key Features

- ⏱️ **Flexible Test Modes**:
  - **Time Mode**: Test speed against countdown timers (**15s**, **30s**, **60s**, or **120s**).
  - **Words Mode**: Test accuracy over fixed word quantities (**10**, **25**, **50**, or **100** words).
- 📊 **Real-Time Analytics & Detailed Breakdown**:
  - Live calculation of **Gross & Net WPM** (Words Per Minute).
  - Accurate character-level **Accuracy (%)** tracking.
  - Comprehensive summary of **Correct**, **Incorrect**, and **Total** characters upon test completion.
- 🎵 **Auditory Typing Feedback**: Real-time mechanical keyboard sound effect (`type.wav`) triggered on keypresses.
- 🎨 **Visual Feedback & Error Highlighting**:
  - Real-time character status color indicators (untyped, correct, incorrect, missing).
  - Smooth animated cursor position tracking.
  - Enhanced backspace support (including hold-to-delete across word boundaries).
- 📜 **Auto-Scrolling Viewport**: Keeps the current active line in focus by smoothly shifting lines as you type.
- ⌨️ **Keyboard Navigation & Quick Controls**: Instant restart via `Tab` or `Esc` keys and auto-refocusing input handler.
- 🌙 **Minimalist Dark Theme**: Sleek dark aesthetic (`#1a1a2e` background) powered by `Space Mono` typography.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Component-based UI library |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Next-generation frontend tooling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework |
| **Routing** | [React Router v7](https://reactrouter.com/) | Declarative routing library |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent UI icon set |
| **Typography** | [Google Fonts](https://fonts.google.com/) | Space Mono & Inter fonts |
| **Audio** | HTML5 Audio API | Real-time typing keypress audio feedback |
| **Linting** | [ESLint 9](https://eslint.org/) | Code quality & standards enforcement |

---

## 📁 Project Structure

```
zamartype/
├── public/                  # Static public assets
├── src/
│   ├── assets/
│   │   ├── icon.png         # Application brand logo icon
│   │   ├── react.svg        # React logo SVG
│   │   └── type.wav         # Mechanical keypress audio effect
│   ├── components/
│   │   ├── Logo.jsx         # Header branding & logo component
│   │   ├── Navbar.jsx       # Test mode & duration selection bar
│   │   ├── TypingSimulator.jsx # Core typing engine, state management, timer & stats
│   │   └── WordBanks.jsx    # Word list generator dictionary
│   ├── App.jsx              # Application root component
│   ├── index.css            # Global CSS, font imports & Tailwind styles
│   └── main.jsx             # React entry point & DOM mount
├── .gitignore               # Git ignored patterns
├── eslint.config.js         # ESLint 9 configuration
├── index.html               # HTML entry document
├── package.json             # NPM package scripts and dependencies
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.js           # Vite build configuration
```

---

## 🔑 Environment Variables

Zamar⚡Type is a pure client-side React web application and does **not require any environment variables** to run out of the box.

If custom backend APIs or environment configs are added in the future, create a `.env` file in the project root:

```env
# Optional Environment Variables
VITE_APP_TITLE=ZamarType
```

---

## 🚀 Getting Started

Follow these steps to set up and run Zamar⚡Type locally.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (included with Node.js) or `yarn` / `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Syber-Tek/zamartype.git
   cd zamartype
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Development Server

Start the Vite local development server with hot module replacement (HMR):

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

Compile and bundle the project for production:

```bash
npm run build
```

The optimized build files will be placed in the `dist/` directory, ready to deploy to platforms like Vercel, Netlify, or GitHub Pages.

### Preview Production Build

Test and preview the production build locally:

```bash
npm run preview
```

### Code Quality & Linting

Run ESLint to check for code formatting and potential code issues:

```bash
npm run lint
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Tab` / `Esc` | Instant restart of current typing test |
| `Space` | Complete word and advance to next word |
| `Backspace` | Delete character / move back to previous character or word |
| `Hold Backspace` | Rapidly delete text across characters |

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!

1. Fork the Project repository
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
