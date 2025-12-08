# Secret Santa Auto Select

A beautiful, Christmas-themed Secret Santa generator built with React and Tailwind CSS.

## Features

- 🎄 **Festive UI**: Snowfall animation, Christmas colors, and smooth transitions.
- 👥 **Player Management**: Add players manually or import from CSV.
- 🔄 **Smart Matching**: Guarantees a perfect closed loop (everyone gives one, receives one).
- 📊 **Visual Results**: View assignments as a list or an interactive circular diagram.
- 📄 **Export**: Download results as a PDF or copy to clipboard.

## How to Use

1. **Add Players**: 
   - Type a name (and optional email) and click "Add".
   - Or drag & drop a CSV file.
   
   **CSV Format Examples:**
   ```csv
   name,email
   John,john@mail.com
   Sarah,sarah@mail.com
   ```
   OR
   ```csv
   John
   Sarah
   Mike
   ```

2. **Generate**: Click the "Generate Secret Santa" button.
3. **View Results**: Toggle between List and Diagram views.
4. **Share**: Download the PDF or copy the assignments.

## Tech Stack

- React
- Tailwind CSS
- Framer Motion (Animations)
- jsPDF (PDF Export)
- PapaParse (CSV Import)
- Lucide React (Icons)
