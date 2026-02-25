# AutoCap - Feedback Module Setup

This document provides instructions on how to set up and run the fully completed Feedback Module spanning the Supabase database, FastAPI backend, and React TS frontend.

## 1. Database Setup (Supabase)
Navigate to your Supabase project dashboard > **SQL Editor**.
Copy the contents of `ai-service/sql/001_feedback_module.sql` and run it. This will create:
- `feedback_categories` table
- `feedback` table
- `feedback_attachments` table
- `feedback_votes` table
- The custom `feedback_status` enum type and default categories.

## 2. Backend Setup (ai-service)
1. Navigate into the `ai-service` directory.
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your environment variables in `.env` (a `.env.example` has been provided):
   ```
   SUPABASE_DB_URL=postgresql://postgres.mztbiewiqjnairxnurfk:XOT0B9LkUQ9CrZcC@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API endpoints for `/feedback` and `/admin/feedback` are now fully active.

## 3. Frontend Setup (React)
1. Navigate into the `frontend` directory.
2. Install the required `recharts` library for the analytics dashboard (NOTE: Run this in a terminal with execution policies enabled, e.g., command prompt, or fix PS policy):
   ```bash
   npm install recharts
   ```
   *(If you encounter a PowerShell "Execution Policies" error, try running `npm.cmd install recharts` or use Git Bash)*
3. Make sure your `.env` or `vite-env` has the correct `VITE_API_URL` pointing to `http://localhost:8000`.
4. Import the components wherever you need them in your application:
   - `FeedbackList` for regular users to see suggestions and vote.
   - `FeedbackForm` for users to submit new ideas or bug reports.
   - `FeedbackStats` for admin overview of feedback health.
   - `AdminFeedbackDashboard` for the complete admin view to manage statuses and respond to users.
5. All components are styled in `feedback.css` following your AutoCap Dark Theme specifications.

## 4. Using the Components
```tsx
import React, { useState } from 'react';
import FeedbackList from './components/feedback/FeedbackList';
import FeedbackForm from './components/feedback/FeedbackForm';
import AdminFeedbackDashboard from './components/feedback/AdminFeedbackDashboard';

function App() {
  const [view, setView] = useState('list'); // 'list', 'form', 'admin'
  
  return (
    <div>
      {/* Navigation omitted for brevity */}
      {view === 'list' && <FeedbackList onNewFeedbackClick={() => setView('form')} />}
      {view === 'form' && <FeedbackForm onCancel={() => setView('list')} onSuccess={() => setView('list')} />}
      {view === 'admin' && <AdminFeedbackDashboard />}
    </div>
  )
}
export default App;
```
