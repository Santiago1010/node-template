# Database Models (Sequelize)

This directory contains all the Sequelize models for the application. Each model represents a table in the database and is used by Sequelize to perform database operations (queries, insertions, updates, etc.).

## File Structure

```
models/
├── users/
│   └── usrAccounts.model.js
└── index.js
```

---

### `index.js`

This is the central file for the models system. It has a crucial role: **it automatically discovers, loads, and initializes all the models** in this directory and its subdirectories.

**Key Responsibilities:**

1.  **Model Discovery**: It recursively scans the `models/` directory to find all files ending in `.model.js`.
2.  **Initialization**: It loads each model file and initializes it with the global Sequelize instance.
3.  **Association Setup**: After all models have been loaded, it calls the `associate` method on each model (if it exists). This is critical because it ensures that relationships (like `belongsTo`, `hasMany`, etc.) are created only after all models are available, preventing circular dependency issues.

Thanks to this file, you **never need to manually `require` a model file elsewhere in the app**. All initialized models are attached to the `db` object and can be accessed from there.

---

### Model Files (e.g., `users/usrAccounts.model.js`)

Each `.model.js` file defines the schema and configuration for a single database table.

**General Structure of a Model File:**

1.  **Schema Definition**: A `Schema` object defines all the columns of the table, their data types (`DataTypes.STRING`, `DataTypes.INTEGER`, etc.), constraints (like `allowNull`, `primaryKey`), and default values.
    -   **Getters and Setters**: Models can have custom getters and setters to transform data when it is read from or written to the database. For example, the `password` field in `usrAccounts.model.js` automatically encrypts the value before saving it and decrypts it when it's read.
2.  **`ExtendedModel` Class**: A class that extends `Sequelize.Model` and contains the model-specific logic.
3.  **`associate` Method**: A static method within the `ExtendedModel` class where all the model's relationships are defined. This is where you would declare that a `User` `hasMany` `Posts`, for example.
4.  **`config` Method**: A static method that returns the model's configuration, including the table name and other Sequelize options like `timestamps` and `paranoid` (for soft deletes).

## How to Create a New Model

While you can create model files manually, this project is set up to use a script for consistency.

1.  Run the model generation script:
    ```bash
    npm run models:generate
    ```
2.  Follow the interactive prompts to define the name and attributes of your new model.
3.  The script will create the necessary `.model.js` file in the appropriate directory.
4.  Open the newly created file and define any associations in the `associate` method.

The `index.js` file will automatically pick up the new model the next time the application starts.
