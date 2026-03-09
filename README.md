# SaaS Analytics Dashboard (Vue 3, Pinia, & 100% Serverless)

> A production-quality, fully responsive SaaS analytics dashboard built with **Vue 3** and **Pinia**. This project demonstrates a complete, feature-rich application that runs **100% serverless** by using browser `localStorage` as a persistent "database."


This is a portfolio-ready project designed to showcase mastery of the modern Vue.js ecosystem, component-based architecture, and complex, reactive state management. All data (users, sales, settings) is fetched from and persisted to `localStorage`, making it a full-stack, client-side application.

## ✨ Core Features

* **⚡ 100% Serverless "Backend"**: All app data (users, sales, profile) is persisted in `localStorage` and managed by Pinia. On boot, the app rehydrates its state from storage.

* **🍍 Global State Management**: A centralized **Pinia** store (`dataStore`, `settingsStore`) manages all application state, making data reactive and available across all components.

* **⚙️ Full CRUD Functionality**:

  * **Users Management**: Full Create, Read, Update, and Delete functionality for users.

  * **Sales Management**: Full Create, Read, Update, and Delete functionality for sales records.

* **📊 Interactive Data Charts**:

  * **Line Chart**: Revenue over time on the main dashboard.

  * **Bar Chart**: Monthly revenue breakdown on the Analytics page.

  * **Donut Chart**: Device breakdown on the Analytics page.

* **🔑 Global Date-Range Filter**: A global filter in the topbar that *reactively* updates all relevant components (stat cards, charts, and tables) across the entire application.

* **📄 Reusable Components**:

  * **`DataTable.vue`**: A powerful, generic table component with sorting, searching, and pagination.

  * **`BaseModal.vue`**: A beautiful, accessible modal (using Headless UI) reused for both "Add" and "Edit" forms.

  * **`ConfirmModal.vue`**: A reusable confirmation modal for all "Delete" actions.

* **📥 Client-Side CSV Export**: An "Export CSV" feature on the Sales page that generates and downloads a CSV file from the client-side data.

* **📱 Modern, Responsive UI**:

  * Styled with **TailwindCSS** for a "Linear/Vercel" aesthetic.

  * Fully responsive down to 360px.

  * Includes a sliding overlay menu for mobile navigation.

* **🔧 User Settings**: A functional settings page to update user profile information (name, email), which also persists to `localStorage` and updates the UI in real-time.

## 🚀 Architectural Highlights

1. **The `localStorage` Backend**: On app load (`App.vue`), the Pinia stores call an `init()` action. This action checks `localStorage` for existing data. If found, it populates the store. If not, it seeds the store with mock data. A `watch` effect in each store then automatically writes any state change back to `localStorage`.

2. **Global Reactive Data**: Components read from `computed` getters in the store (like `filteredSales`). When the global date-range filter changes, all dependent getters recompute and update the UI instantly.

3. **Component Reusability**: `DataTable.vue` accepts dynamic `columns` & `data`, using named slots to inject custom cell templates.


## 🛠️ Tech Stack

* Vue 3 (Composition API)
* Vite
* TypeScript
* Pinia
* Vue Router
* TailwindCSS
* Headless UI
* Chart.js + vue-chartjs
* date-fns

## 📦 Getting Started

### Prerequisites
* Node.js 18+
* npm or yarn

### Installation

```bash
cd my-saas-dashboard
npm install
```

### Running the Project

```bash
npm run dev
```

Visit: `http://localhost:5173`

### Build

```bash
npm run build
```

Output goes to the `dist/` folder.


---


