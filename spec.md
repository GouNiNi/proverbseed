# ProverbSeed Specifications

## 1. Project Features (Agnostic)

### 1.1 Proverb Discovery Engine
- **Core Loop**: Presents one biblical proverb at a time. The delivery is randomized to encourage fresh meditation on each verse.
- **Focus on Single Verses**: The dataset is strictly filtered to include only "one-liner" proverbs (sentences/aphorisms) from the Solomonic collections.
- **Navigation**: Simple, intuitive controls to move to the next proverb.

### 1.2 Advanced Categorization System
- **Theme Assignment**: Users can tag each proverb with one or more custom themes (e.g., "Sagesse", "Parole", "Travail").
- **Theme Creation**: Users can define new themes on the fly directly from the categorization interface.
- **Persistent Personal Database**: All assignments are stored locally. Over time, the user builds a personal map of biblical wisdom categorized by their own understanding/needs.

### 1.3 Categorization Aid
- **Feature**: A toggleable assistant accessible during the categorization process.
- **Functionality**: When active, provides a list of suggested themes based on the proverb's content to help the user start their categorization if they lack inspiration.

### 1.4 Skip & Recycle Logic
- **Feature**: Ability to skip a proverb without categorizing it.
- **Logic**: Skipped proverbs are returned to the pool and will reappear later in the random rotation, ensuring no verse is lost or permanently ignored.

### 1.5 Personal Explorer & Library
- **Feature**: A dedicated view to browse the personal categorized database.
- **Functionality**: Users can select a theme and see all proverbs they have assigned to it, facilitating topical study.

### 1.6 Progression Insight & "Saisons" (Wisdom Garden)
- **Feature**: A discreet indicator of progress and a visual growth representation.
- **Detail**:
  - **Progress**: Displays the percentage of the total collection categorized.
  - **The Wisdom Garden**: A visual, minimalist "garden" that grows/evolves based on the user's regularity and number of categorized proverbs. This is a non-stressful, poetic way to track consistency.

### 1.7 Personal Meditation Notes
- **Feature**: Ability to add personal reflections to any proverb.
- **Functionality**: A dedicated optional text field under the categorization UI. These notes are private, stored locally, and can be reviewed in the Library alongside the proverb.

### 1.8 Daily Reminders (Platform Specific)
- **Feature**: Ability to schedule daily notifications presenting a random proverb or a proverb from a specific theme.
- **Functionality**: Users can set a preferred time for the reminder. On Android, this uses OS-level notifications. On iOS, it will be a web-based prompt or a suggestion to add to home screen for quick access.

### 1.9 Favorites
- **Feature**: Ability to mark specific proverbs as "Favorites".
- **Functionality**: A quick-access toggle (e.g., a heart icon) to highlight proverbs that particularly resonate with the user. Favorites can be viewed separately in the Library.

### 1.10 Data Portability (Export/Import)
- **Export**: Ability to export the entire personal database (categorizations, themes, and favorites) into a single file.
- **Import**: Ability to import a previously exported file to restore or sync categorizations across devices.
- **Integration**: Uses native OS file pickers to save to or load from cloud storage (Google Drive, iCloud, OneDrive) or local storage.
- **Data Decorrelation**: The exported file is strictly **metadata-only**. It contains the user's themes, favorites, notes, and progress links via biblical references (IDs), but **excludes** the actual biblical text to ensure portability and privacy.

---

## 2. Graphic Charter (Design)

### 2.1 Atmosphere & Aesthetic
- **Core Feeling**: Peace, serenity, meditation, and spiritual growth.
- **UI Style**: Minimalist, clean, with soft transitions and ample whitespace. Use of organic shapes (rounded corners) and subtle shadows (soft depth).

### 2.2 Color Palette
- **Primary (Sage Green)**: `#A3B18A` - Primary actions, progress indicators.
- **Secondary (Moka)**: `#5D4037` - Emphasis, selected states, deep titles.
- **Supporting (Sand)**: `#C6AC8F` - Borders, icons, secondary text.
- **Background (Bone White)**: `#FAF9F6` - Main background (paper-like, low strain).
- **Text (Charcoal Brown)**: `#3E2723` - High readability content.

### 2.3 Typography
- **Title & Branding Font**: `Great Vibes` (Google Fonts) - Calligraphy/quill style for headers and splash screen.
- **Body & Functional Font**: `Source Serif 4` (Google Fonts) - Elegant, readable serif font for proverbs and UI text.

### 2.4 UI Elements & Motion
- **Splash Screen**: 0.5s fade-in with calligraphic minimalist branding.
- **Transitions**: 300ms smooth fades/blurs for proverb changes.
- **Cards**: Minimalist centered cards with very soft shadows.

---

## 3. Technical Implementation

### 3.1 Core Architecture
- **Framework**: **Vite + React** for a fast, modern frontend experience.
- **PWA Capabilities**: Powered by `vite-plugin-pwa` to handle service worker registration, offline caching, and manifest generation.
- **Platform Strategy**: 
  - **Android**: OS-level notifications via Service Worker triggers.
  - **iOS**: Strictly optimized web app experience (no background notifications as per user request).

### 3.2 Data Management
- **Dataset**: Static **JSON** extraction of the Book of Proverbs (Louis Segond 1910). Focused on chapters 10-22 and 25-29.
- **Portability Logic**: To ensure data decorrelation, every piece of user data (notes, categories, favorites) is linked to a unique **Proverb Reference ID** (e.g., `PROV_10_1`).
- **Storage Layer**: **localForage** (IndexedDB wrapper) to handle all user-generated data.
- **Data Schema**:
  - `proverbs`: The static list of verses (bundled with the app).
  - `user_themes`: Array of custom theme names.
  - `categorized_proverbs`: Mapping of **Proverb IDs** to Theme IDs.
  - `favorites`: Array of **Proverb IDs** marked as favorites.
  - `meditation_notes`: Mapping of **Proverb IDs** to user-written text notes.
  - `user_stats`: Data tracking consistency and growth for the "Wisdom Garden".
  - `settings`: User preferences.

### 3.3 Key Technical Components
- **Discovery Engine**: A randomizer helper that filters out already categorized proverbs from the pool.
- **Categorization UI**: A dynamic input component with autocomplete for existing themes and the ability to create new ones on `Enter`.
- **Portability Modules**: Logic to serialize/deserialize the `localForage` state into a JSON/backup file using the **File System Access API** (where supported) or standard Blobs/File Uploads for universal mobile compatibility.
- **Progression Logic**: Computed property comparing `categorized_proverbs` count vs total `proverbs` count.
- **Service Worker**: Configured for `stale-while-revalidate` caching of the app shell and proverbs dataset.
