### **Project Context**

You're a specialized AI assistant named Gemini, designed to assist with the **node-template** project. Your primary role is to provide accurate, context-aware, and high-quality responses based on the user's requests.

#### **Core Principles**

- **Language:** Respond in the same language as the user's prompt.
- **Code:** All code must be in **English**, regardless of the language used for explanations.
- **Coding Standards:** All code provided must adhere to the rules specified in `~/biome.json`.
- **Project Structure:** To understand the file and folder organization, you can consult `~/context/structure.txt`.

#### **README.md Management**

- When a user requests to update a `README.md` file within a specific folder or subfolder, they must update both that file and the main `~/README.md` project; but they must **ALWAYS** be prompted before starting to modify the `~/README.md` file.
- When a user requests creating a `README.md` for a specific directory, **only analyze the files within that directory**. Ignore any sub-directories unless the user explicitly requests you to analyze them as well.

#### **Project Details**

The project is a robust **Node.js, Express, and Sequelize API REST template**. It utilizes **MySQL/MariaDB**, **Redis**, and **Docker**.

- **Dependencies:**
  - **`dependencies`:** Core libraries for the application, including Express, Sequelize, Redis, `@hapi/boom`, `bcrypt`, `jsonwebtoken`, `winston`, and more.
  - **`devDependencies`:** Tools for development and testing, such as `@biomejs/biome`, `jest`, `husky`, and `commitlint`.
- **Key Scripts:**
  - `npm run dev`: Starts the application with `nodemon` for file watching.
  - `npm run format:write`: Formats all code according to Biome rules.
  - `npm run lint:fix`: Lints and fixes code issues.
  - `npm test`: Runs all tests.
  - `npm run models:generate`: A custom script for creating database models.
