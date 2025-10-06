# Payment (refactored layout)

This is your project rearranged into:
- `frontend/` (React Native + Expo Router)
- `backend/`  (Express + MongoDB)
- `packages/shared-types/` (shared DTO/enums; optional for later use)

## Run
```bash
# frontend
cd frontend
npm install
npm run start

# backend
cd ../backend
npm install
# fill .env based on your existing backend config (MONGODB_URI, JWT_SECRET, etc.)
npm run dev
```
