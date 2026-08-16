# Aparaitech Student Email Blast - User & Feature Guide

## Core Features Walkthrough

### 1. Student Directory & Search
- Filter students by **College Name**, **Branch**, **Graduation Passout Year**, **Min CGPA**, and **Placement Status**.
- Perform quick text search across names, emails, and phone numbers.
- Export filtered student subsets directly to CSV format.

### 2. Bulk XLSX & CSV Import Engine
- Upload student lists using `.xlsx` or `.csv` files.
- The 10-step validator performs row-by-row checks:
  - Validates required fields (`Name`, `Email`, `College`, `Branch`)
  - Identifies invalid email syntax and CGPA boundary violations
  - Flags duplicate emails existing in the database or within the uploaded file
- Preview interactive breakdowns (Valid vs Invalid vs Duplicates) and download an error report CSV for invalid rows before importing valid records.

### 3. Rich Personalization Email Composer
- Insert dynamic tags into subject line or body HTML:
  - `{Name}`, `{Email}`, `{College}`, `{Branch}`, `{GraduationYear}`, `{CGPA}`, `{PlacementStatus}`
- Toggle between **Desktop** and **Mobile** viewports in the responsive preview modal.
- Dispatch a live test preview to any email inbox.

### 4. WebSocket Real-Time Campaign Progress
- Launch targeted bulk email blasts with rate-limited queueing.
- Live progress bar updates sent count, failed count, current recipient email, and completion percentage over Socket.IO without page refresh.
- Enforces suppression list checks before queueing each email.

### 5. Retry Logic & Analytics
- Safe "Retry Failed Emails" action re-queues only failed logs.
- Executive Recharts charts analyze college distribution and delivery performance over time.
