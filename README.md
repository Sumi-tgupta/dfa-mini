# DFA Minimizer

An interactive web application for building, testing, and minimizing Deterministic Finite Automata (DFA). The project provides a visual editor, step-by-step minimization workflow, and string simulation engine.

**Live Demo:** https://dfa-mini.vercel.app/  
**Repository:** https://github.com/Sumi-tgupta/dfa-mini

---

## Features

- Visual DFA editor with draggable states and transitions
- Add, edit, and delete:
  - States
  - Transition symbols
  - Start state
  - Accept/final states
- Interactive DFA canvas with real-time updates
- String testing and simulation
- Step-by-step DFA minimization
- Toggle between original DFA and minimized DFA
- Import and export DFA definitions as JSON
- Dark mode and light mode support
- Responsive UI for desktop and mobile

---

## Screenshots

Add screenshots here after taking them from the live site.

```text
/public/screenshots/home.png
/public/screenshots/minimization.png
/public/screenshots/string-testing.png
```

Example:

```md
![Home Screen](public/screenshots/home.png)
![Minimization Panel](public/screenshots/minimization.png)
```

---

## Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | Next.js |
| Language | TypeScript |
| UI | React + Tailwind CSS |
| Component Library | Radix UI |
| Icons | Lucide React |
| State Management | Zustand |
| Theme Support | next-themes |
| Deployment | Vercel |

---

## Project Structure

```text
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ dfa/
â”‚   â”‚   â”œâ”€â”€ DFACanvas.tsx
â”‚   â”‚   â”œâ”€â”€ DFAMinimizerPage.tsx
â”‚   â”‚   â”œâ”€â”€ MinimizationPanel.tsx
â”‚   â”‚   â”œâ”€â”€ StatePanel.tsx
â”‚   â”‚   â”œâ”€â”€ StringTester.tsx
â”‚   â”‚   â”œâ”€â”€ Toolbar.tsx
â”‚   â”‚   â””â”€â”€ TransitionSymbolPicker.tsx
â”‚   â””â”€â”€ ui/
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ dfa/
â”‚   â”‚   â”œâ”€â”€ algorithms.ts
â”‚   â”‚   â”œâ”€â”€ store.ts
â”‚   â”‚   â””â”€â”€ types.ts
â”‚   â””â”€â”€ utils.ts
â””â”€â”€ app/
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Sumi-tgupta/dfa-mini.git
cd dfa-mini
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production build
npm run lint     # Run ESLint
```

---

## How to Use

### 1. Create a DFA

- Add states from the state panel
- Mark one state as the start state
- Mark one or more states as accepting states
- Add transitions between states for each symbol in the alphabet

### 2. Test Strings

- Open the String Tester panel
- Enter an input string
- Run the simulation
- Observe each transition step-by-step
- The result will indicate whether the string is accepted or rejected

### 3. Minimize the DFA

- Open the Minimization panel
- Click the minimize button
- Navigate through each minimization step
- Compare distinguishable and equivalent states
- View the minimized DFA

### 4. Export / Import

- Export the current DFA as a JSON file
- Import a previously saved DFA configuration

---

## DFA Minimization Process

The application performs DFA minimization using partition refinement.

Typical workflow:

1. Separate accepting and non-accepting states
2. Compare transitions for each state pair
3. Refine partitions iteratively
4. Merge equivalent states
5. Generate the minimized DFA

This process is shown visually in the minimization panel so users can understand each stage instead of only seeing the final result.

---

## Example DFA JSON

```json
{
  "states": ["q0", "q1", "q2"],
  "alphabet": ["0", "1"],
  "startState": "q0",
  "acceptStates": ["q2"],
  "transitions": {
    "q0": {
      "0": "q1",
      "1": "q0"
    },
    "q1": {
      "0": "q2",
      "1": "q0"
    },
    "q2": {
      "0": "q2",
      "1": "q2"
    }
  }
}
```

---

## Key Components

### `DFACanvas.tsx`
Handles rendering and interaction for states and transitions.

### `StringTester.tsx`
Runs and animates string traversal through the DFA.

### `MinimizationPanel.tsx`
Displays the minimization algorithm and intermediate partitions.

### `Toolbar.tsx`
Provides actions such as reset, import, export, and theme switching.

### `StatePanel.tsx`
Manages creation and editing of DFA states.

---

## Future Improvements

- Support for NFA and Îµ-NFA
- Automatic conversion from NFA to DFA
- Save projects to local storage
- Undo / redo support
- Export DFA as image or PDF
- Shareable links for DFA configurations
- More animation controls during testing

---

## Contributing

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push to your branch

```bash
git push origin feature-name
```

5. Open a pull request

---

## License

This project is licensed under the MIT License.

```text
MIT License
```

---

## Author

Created by Sumi Gupta.
