# 🍻 Game Draft
**Live Demo:** [**gamedraft.co**](https://gamedraft.co)

A board game recommendation app powered by Google's Gemini. Whether you're at the store, library, or your friend's game room, Game Draft will give you some recommendations based on your desired player count and playing time! All you have to do is give it a picture of some games. 

This project was built with the intention of learning the tech stack below. Made during my 3rd week at [Fractal Tech](https://fractalbootcamp.com/)


## ✨ Core Features

* **📷 Visual Collection Recognition:** Snap a photo or use the drag-and-drop/click-to-upload interface. The app uses Gemini Vision AI to identify the board games in your image.
* **🧠 Smart Recommendations:** Get game suggestions powered by Gemini's language model, based on your identified collection, desired player count, and playing time.
* **🎨 Themed & Responsive UI:** A clean interface built with Tailwind CSS and shadcn/ui.

## 🛠️ Tech Stack

|Category   | Technology |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router)                                                                 |
| **Language** | [TypeScript](https://www.typescriptlang.org/)                                                               |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/)                                                                    |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/)                                                                         |
| **API Layer** | [tRPC](https://trpc.io/) & Next.js API Routes                                                               |
| **AI / LLM** | [Google Gemini](https://ai.google.dev/)                                                                     |
| **Testing** | [Vitest](https://vitest.dev/) (Unit/Component) & [Cypress](https://www.cypress.io/) (E2E)                     |
| **UI Libraries** | [Sonner](https://sonner.emilkowal.ski/) (for toasts), [React Markdown](https://github.com/remarkjs/react-markdown) |


## 🚀 Getting Started

To get a local copy up and running for development or contribution, follow these simple steps.

### Prerequisites

* Node.js (v18 or later recommended)
* A package manager like `npm` or `yarn`
* A Google AI Studio API key for the Gemini API.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/game-draft.git](https://github.com/your-username/game-draft.git)
    cd game-draft
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    * Create a new file named `.env.local` in the root of the project.
    * Copy the contents of `.env.example` (see below) into this new file.
    * Fill in your own **Gemini API Key**.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!

### Environment Variables

You will need to create a `.env.local` file in the root directory with the following variable:

```sh
# .env.example

# Get this from [https://ai.google.dev/](https://ai.google.dev/)
GEMINI_API_KEY="your_google_ai_api_key_here"
```

## Backend Infrastructure (Ready for Future Use)

This project also includes a fully configured backend for user authentication and data persistence, even though these features are not implemented on the frontend. The necessary Drizzle ORM schema and API routes are in place.

* **Database:** Connected to a serverless PostgreSQL instance on [Neon](https://neon.tech/).
* **Authentication:** Set up with [Better-Auth](https://better-auth.dev/) for handling user sessions.

To work on these backend features in a development environment, the following additional environment variables would be needed in your `.env.local` file:

```sh
# For the Neon Database Connection
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# For Better-Auth
BETTER_AUTH_SECRET="your_secret_here"
BETTER_AUTH_URL="http://localhost:3000"
```