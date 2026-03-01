# ProverbSeed Implementation Plan

## Goal Description
We are building "ProverbSeed", a PWA to read and categorize biblical proverbs (Louis Segond 1910, specific single-verse sections). The app focuses on local storage (serverless) and a meditative aesthetic.

## User Review Required
> [!IMPORTANT]
> **Graphic Charter:** I've added a detailed charter in `spec.md` including colors (Sage Green, Moka, Sand) and typography (Great Vibes & Source Serif 4).
> **Notifications:** Confirmed as **Android-only** (OS-level) for background reminders. iOS will focus on the core app experience without background reminders.
> **Tech Stack:** Confirmed **Vite + React + localForage**.

## Proposed Architecture

### 1. Data Layer
- **Proverbs Dataset**: Static JSON file containing verses from Proverbs 10:1-22:16 and 25:1-29:27.
- **Translation**: Louis Segond 1910.

### 2. Storage Layer
- **localForage (IndexedDB)**: Stores user-defined themes, proverbs-to-theme mappings, favorites, meditation notes, garden progress, and settings.

### 3. Application Layer (PWA UI)
Strictly following the Graphic Charter in `spec.md`:
- **UI Architecture**: React with Vanilla CSS for precise aesthetic control.
- **Views**:
  - **Launch**: 0.5s minimalist calligraphic splash.
  - **Main**: Centered proverb card with theme input, "Skip" button, Favorites toggle, and **Meditation Note** input.
  - **Themes / Library**: Grid/List of user categories, a dedicated "Favoris" section, and access to the **Wisdom Garden (Saisons)**.
  - **Settings**: Toggle "Aide à la catégorisation" and "Notifications" (Android).
  - **Portability**: View with buttons to "Exporter" (saves metadata/references only, decorrelated from biblical text) and "Importer" using native OS pickers.

## Verification Plan
1. **PWA Audit**: Verify installability and offline support via Lighthouse.
2. **Data Consistency**: Ensure themes persist across reloads and offline sessions.
3. **Visual Audit**: Verify colors and typography match the Charter exactly.
