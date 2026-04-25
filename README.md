# Limitless Training Simulation (v2.0.012)

 A professional, secure employee dashboard for the Limitless Training Simulation (LTS). This application allows members to sign in using their Employee ID to view their current wave assignment, cluster, and team details.

## Features
- **Secure Login**: Authentication against a centralized member data array.
- **Session Persistence**: Automatic login using `localStorage`.
- **Professional Dashboard**: Clean, modern UI showing member profile and assignments.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop.
- **Smooth Animations**: Interactive transitions using Framer Motion.
- **Lucide Icons**: High-quality vector icons for a professional look.

## Data Structure
The application uses an external JSON file located at `src/data/employees_lts.json`. Each employee object contains:
- Employee ID
- Name
- Email
- Wave
- Cluster
- Team

## Waves Note
The system employs rigid constraints for data consistency. The only accepted wave values are:
- `27 April ⏰ 09:30 AM - 11:30 AM`
- `27 April ⏰ 12:30 PM - 02:30 PM`

## Tech Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React

## GitHub Sync Setup
The application syncs its database directly with a GitHub repository for a simplified serverless backend configuration.
1. Create `.env` file in project root
2. Add these variables (note the changed repo and file path for LTS):
     VITE_GITHUB_TOKEN=your_fine_grained_token
     VITE_GITHUB_REPO=drpeterramsis/lts
     VITE_GITHUB_FILE_PATH=src/data/employees_lts.json
     VITE_GITHUB_BRANCH=main
3. Make sure `.env` is in `.gitignore`
4. Token needs Contents: Read & Write permission

## Version History
v2.0.012 - Fixed: search results now show all employee fields
           Fixed: search runs on normalized data (lowercase fields)
           Fixed: search card reads emp.name/email/team/cluster/wave
           Added: facilitator stats page with full breakdown
           Stats: total, per-wave, per-cluster, per-team, table sizes
           Map: removed word "Table" from table cards (letter only)
           Map: cluster headers now purple (#7A3A94) for visibility
v2.0.010 - Fixed: NaN duplicate key in SeatingMap (root cause: parseInt on cluster)
           Fixed: sk() helper added — sanitizes all key values
           Fixed: normalizeEmployee uses String() never parseInt/parseFloat
           Fixed: tableGroups uses cluster__team as groupKey (double underscore)
           Fixed: clusterGroups sorted with Number() + isNaN() guard
           Fixed: all .map() renders in SeatingMap use sk() for keys
v2.0.009 - Fixed: NaN key caused by undefined cluster/team values
           Fixed: duplicate keys in SeatingMap table list
           Fixed: safeKey() utility added for guaranteed unique keys
           Fixed: tableGroups uses cluster||team as group key
           Fixed: clusterGroups deduplication and sort
           Fixed: normalizeEmployee returns fallback for missing fields
           Fixed: null employee records filtered after normalization
           Added: SeatingMap debug logging (remove after confirmed)
 v2.0.006 - Fixed: employee loading via bundled Vite import (no more 404s)04s)
           Fixed: GitHub API path corrected to src/data/employees_lts.json
           Fixed: removed broken /data/employees_lts.json fallback
           Fixed: login title color changed to light grey for visibility
           Fixed: dark mode disabled globally, light mode forced always
           Seating map now shows tables grouped by cluster
           Map is wave-isolated: one wave shown at a time
           Member counts are per-wave only (never combined)
           Normal employees see own wave only, open own table only
           Facilitator/Superuser can toggle between wave maps
           Wave toggle renders each wave as a fully separate map
           YOU ARE HERE indicator on user's own table
v2.0.005 - Login confirmation step added (shows full name + email)
           Employee cards display raw cluster number only
           Tactical Team displays A/B/C/D only (no "Team A")
           Normal employee map: summary view for all tables,
           but can open only their own table modal
v2.0.004 - JSON structure kept as-is (team:"A", cluster:"1")
           App normalizes values internally at runtime
           Static Vite import used for src/data/employees_lts.json
           getTeamColor/getTeamLabel/getClusterLabel helpers added
           All validation updated to match actual JSON values
           ID comparison uses String().trim() everywhere
           Form dropdowns updated to save short format values
           Loading state added to login button
v2.0.001 - Global theme updated: Indigo + Purple + Light Gray used across all screens
           Footer updated to dim gray with white text
           Branding updated from EVA/EVA-SIM to Limitless across login and header
v2.0.000 - LTS Transformation: Complete refactor from EVA Training Simulation to Limitless Training Simulation (LTS).
           Updated terminology (Kingdom -> Cluster, Employee Number -> Employee ID).
           Updated exact data schema matching LTS requirements.
           Updated color variables and default theme specific to LTS.
           Hardened GitHub sync mapping and Wave parsing to strict LTS options.
v1.0.032 - Feature: Added "Total Records" stats card at the top of Wave Statistics page.
v1.0.031 - Feature: Synchronized Wave Stats team popup with Seating Map design (added Titles/Units).
           Style: Unified team icon logic across the entire dashboard.
v1.0.030 - Fix: Restored compact grid layout (Kingdoms/Tables) as the primary view.
           Feature: Added Title and Unit as subtitle inside the team details popup.
           Style: Improved popup layout with better hierarchy and contrast.
v1.0.029 - Fix: Switched Seating Map to detailed version and refined Title/Unit subtitles styling in tables and popups.
v1.0.028 - Map Grid: Applied requested style adjustments.
v1.0.027 - Map Popup: Wave icon replacement (⏰) and added Title/Unit as subtitle to member names in popup details.
v1.0.026 - Map Popup: Added Title and Unit as subtitle to member names in popup details
v1.0.025 - Map Grid: mobile layout optimized to 1 column per 5 kingdoms (1x5)
v1.0.024 - Map Grid: mobile layout optimized to 5 columns per row
v1.0.023 - Map Grid: optimized to 5 tables per row
v1.0.022 - Improved Duplicate Modal: added "Select First of All" and "Unselect All" options
v1.0.021 - Improved Duplicate Modal: click-outside to close, fully visible details, and toggleable selection
v1.0.020 - Seating Map visible to Employee, Superuser, Facilitator
           Employee & Superuser: map limited to their own wave (no selector)
           Facilitator: map supports all waves with wave selector
           Map blocks show icon + member count only
           Click rules: employee/superuser only own table; facilitator any table
           Added Stats page for Facilitator & Superuser
           Stats shows waves summary + per-wave kingdom/team member counts
           Stats updates live after add/edit/delete
v1.0.017 - New Seating Map page
           Wave-based map auto-loaded from login ID
           Kingdoms grouped with Teams inside
           Employee name highlighted in their table
           "Your Table" gold border + badge
           Click own table → see full team popup
           Facilitator: wave selector + all tables clickable
           Member count badge on each table
           Team emoji mapping
           Empty/loading states handled

v1.0.016 - Fixed edit duplication bug (.map replace)
           Edit existing member form
           Delete member with confirmation modal
           GitHub API sync for employees.json
           Dynamic dropdowns from live data
           "Other" option for manual entry
           Toast notifications (success/error/loading)
           Edit + Delete buttons on member cards
           Auto navigate back if list becomes empty
           githubSync.ts utility updated
           Reverted Light Mode colors from black to white to fix unreadable cards

v1.0.013 - Refactored CSS Colors
           Fixed Light Mode colors to map #ffffff to #000000
           Excluded prefixed dark mode colors from being affected

v1.0.012 - Add New Member form (facilitator only)
           Edit existing member form
           GitHub API sync for employees.json
           Dynamic dropdowns from live data
           "Other" option for manual entry
           Toast notifications (success/error)
           Edit button on member cards
           githubSync.ts utility created
           Fine-grained token support

v1.0.011 - Light mode text colors fixed,
           Details/labels use black in light mode,
           Name stays gold in both modes,
           Drill-down all text readable in light mode,
           Member cards text fixed in light mode,
           Swipe back direction fixed (right to left),
           Vertical scroll no longer conflicts with swipe,
           "Can't find ID" link black in light mode

v1.0.009 - Login screen: "Can't find your ID?"
           WhatsApp link added below login button,
           Pre-filled message includes EVA SIM context,
           Links to +201069996672

v1.0.008 - Division added to employee profile card,
           Division added to drill-down member cards,
           Logout button made smaller and subtle,
           Mobile info cards changed to single column,
           No 2x2 grid on mobile anymore

### v1.0.010
- **Fixed Footer Syntax**: Resolved JSX errors caused by unclosed `<br>` tags.
- **Organization Branding**: Updated footer credit to "Under Supervision of Training Department".
- **Superuser ID Update**: Manually updated Superuser list (4639).

### v1.0.007
- Profile card split into 2 rows (identity row + info cards row)
- Name no longer collapses on desktop
- Info cards in 2x2 grid on mobile
- Logout moved into fixed footer bar
- Footer: developer credit + version + logout
- Swipe right to go back in drill-down
- Swipe hint shown on touch devices
- Mobile header always shows EVA SIM

### v1.0.009
- **Profile card fully redesigned**: New horizontal layout with 5 distinct sections and unified accent styling.
- **Wave Data Modularized**: Wave assignments split into separate WAVE DATE and WAVE TIME cards for clarity (split by helper logic).
- **Role-Based DOM Enforcement**: Strict access matrix (Employee/Facilitator/Superuser) with complete removal of restricted sections from the DOM for employees.
- **Navigation Enhancements**: Logout moved to a fixed, bottom-right floating pill button for universal access.
- **Mobile Optimization**: Fixed sticky header to always ensure the "EVA SIM" title is persistent and visible.
- **Font & Display Consistency**: Unified font-family (Outfit/Monospace) and sizes (10px labels, 22px values) across all tactics cards.

### v1.0.008
- **Superuser role added**: Dedicated access level for administrative oversight using specific Employee IDs.
- **Role-Based Visibility Matrix**: Dashboard now dynamically adjusts based on 'employee', 'facilitator', or 'superuser' roles.
- **Enhanced Profile Card**: Added Employee ID field at the top, styled with a professional monospace chip.
- **Branding Update**: Implemented unique welcome messages and badges (⭐) for superuser status.
- **Navigation Polish**: Corrected facilitator login bypass for administrative accounts.

### Previous v1.0.007
- **Black + Gold (#ffc000) theme applied**: Complete visual overhaul for institution branding.
- **Enhanced Member Cards**: Added Unit, Title, and ID fields with professional labeling.
- **Back Navigation Buttons**: Replaced text links with pill-shaped styled buttons at all drill-down levels.
- **Search Optimization**: Kingdom and ID search now triggers at 1 character for rapid access.
- **Team Intelligence**: Added team-specific icons for the five core divisions (Electricians, Engineering, Gold, Mushroom, Plumber).
- **SEO & Social**: Integrated full meta tags and custom OG social thumbnail for EVA Annual 2026.
- **Framer Motion Animations**: Implemented staggered entrances, fade-ups, and interactive feedback throughout the portal.

### v1.0.005
- **Stability & Performance**: Fixed ESM compatibility issues in build configuration.
- **Search Engine**: Added professional search bar with field-specific filtering (Employee Number, Name, Title, etc.).
- **Theme Engine**: Integrated Light/Dark mode with persistence in `localStorage`.
- **UI Transformation**: Replaced underscores in Wave names with clock emoji (⏰).
- **Architecture**: Refactored into a modular multi-file structure for production readiness.
- **Auth Flow**: Polished 2-step login with identity confirmation screen.

### v1.0.003
- Updated login flow: Now uses Employee ID only with a 2nd confirmation step (showing Name and Unit).
- Updated employee data with new records and fields (Kingdom, Level).
- Optimized dashboard display for new data structure.

### v1.0.002
- Separated employee data into an external JSON file (`src/data/employees.json`) for easier management.
- Updated version numbering across the application.

### v1.0.001
- Initial release with core login and dashboard functionality.
- Implemented session persistence.
- Added professional blue/white theme.
- Integrated Google Fonts (Inter & Outfit).
 & Outfit).
