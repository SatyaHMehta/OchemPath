Cleanup: Remove legacy quiz navbar and page

- Removed Quiz link from Navbar (`src/components/navbar/Navbar.jsx`).
- Will delete legacy /quiz page files:
  - `src/app/quiz/page.jsx`
  - `src/app/quiz/page.module.css`
- Will remove Free Quiz Trial button in Course card.
- Will scan for `/quiz` references and clean them up.
