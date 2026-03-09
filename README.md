# SaaS Analytics Dashboard (Vue 3, Pinia, & 100% Serverless)


## ✨ Core Features

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


