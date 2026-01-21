# AI-Assisted Mobile Development Guide
*Best practices for building production-ready Expo/React Native apps for ANY niche with AI Agents.*

## 1. The "Master Initialization Prompt" (Universal)
**Copy and paste this prompt to start ANY new project.** This prompts the AI to organize your code professionally, regardless of whether you are building a game, a social network, or a business tool.

```markdown
You are a Senior Full Stack Mobile Developer. I want you to build a **[APP_NICHE]** app named **[APP_NAME]**.

### 1. Technology Stack
- **Frontend**: React Native with Expo.
- **Backend**: Node.js/Express (or your preferred backend).
- **Database**: PostgreSQL (or your preferred database).
- **Language**: TypeScript (Strict Mode).
- **Structure**: Clean Architecture / Monorepo-style.

### 2. Project Architecture
You must strictly follow this folder structure to ensure maintainability:
- **/shared**: Contains logic shared between client and server (Types, Validation Schemas, Constants).
- **/server**: The API Backend Logic.
  - `routes`: API Endpoints.
  - `storage`: Database interactions.
- **/client**: The Mobile Application.
  - `/screens`: Full page views.
  - `/components`: Reusable UI elements.
  - `/navigation`: Routing configuration.
  - `/hooks`: Custom logic and state management.
  - `/services`: API calls and external integrations.

### 3. Coding Standards
- **Type Safety**: Strictly typed interfaces. No `any`.
- **Modularity**: Separate UI from Logic. Use Hooks for state.
- **Theming**: Use a centralized theme system for Colors/Spacing.
- **Environment**: Use Environment Variables for secrets and APIs.

### 4. Implementation Plan
Please execute the following steps:
1.  **Define Core Entities**: Create the data models in `/shared` first.
2.  **Setup API**: Initialize the server to handle these entities.
3.  **Setup App Structure**: Initialize the Expo app with the folder structure above.
4.  **Build Flows**: Implement the Screen flows based on the user journey.

**Begin by defining the core data models for [APP_NAME].**
```

---

## 2. Workflow for Updates & Features
When asking for new features, provide the context of "Entity -> Component -> Integration".

### Step-by-Step Clean Code Strategy:
1.  **Define the Interface (Schema/Types)**:
    -   *Prompt*: "Update `shared/schema.ts` (or your type file) to include the **[ENTITY]**. Fields: **[FIELD_1]**, **[FIELD_2]**."
2.  **Build the Component (UI)**:
    -   *Prompt*: "Create a reusable component for **[ENTITY]**. Use strict typing and our theme system."
3.  **Connect Logic (Hooks)**:
    -   *Prompt*: "Create a custom hook `use[ENTITY_PLURAL]` that handles fetching/updating this data."
4.  **Integrate**:
    -   *Prompt*: "Update the Screen to use this hook and render the component."

---

## 3. Handling Production Builds (The "Clean Build" standard)
To ensure your code is ready for distribution, stick to these rules:

### Rule A: Rigorous Type Checking
-   *Prompt*: "Before finishing, ensure all types are strictly defined. Validate that navigation props and API responses are fully typed."

### Rule B: Configuration Check
-   *Prompt*: "Check `eas.json` (or your build config). I need a production bundle (AAB/IPA). Ensure the profile is named `production` and has the correct build settings."

---

## 4. Resolving Issues (The "Review & Fix" Loop)
If a build fails or a bug appears, feed the error back with context.

### The Fix Prompt Template:
> "I am getting the following error when running `[COMMAND]`:
> ```
> [PASTE ERROR LOGS HERE]
> ```
> This might be related to [FILE_NAME].
> 1. Analyze the dependencies in `package.json`.
> 2. Check for missing imports or type mismatches in [FILE_NAME].
> 3. Propose a fix that maintains strictly typed interfaces."
