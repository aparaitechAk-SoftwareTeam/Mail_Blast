# Student Email Blast Web Application - Aparaitech Software

Full-stack, production-ready **Student Email Blast Web Application** built for **Aparaitech Software's recruitment team**. Enable recruiters to manage student applicant databases across partner colleges, run personalized targeted email blasts, monitor real-time sending progress via WebSockets, manage templates, suppressions, schedules, retry failures, and analyze recruitment metrics.

---

## Technical Stack
- **Backend**: Node.js, Express, Socket.IO, Nodemailer, Excel/CSV Parser (`xlsx`), JWT Auth, BcryptJS, Mongoose / Fallback Storage, Node-Cron
- **Frontend**: React (Vite), React Router v6, Bootstrap 5, Lucide Icons, Recharts, Axios, Socket.IO Client
- **Database**: MongoDB Mongoose with automatic zero-config fallback storage for immediate local testing without requiring external database setup.

---

## Project Structure
```
student-email-blast/
├── backend/
│   ├── config/ (db.js, mailer.js)
│   ├── controllers/ (auth, student, upload, campaign, template, report, user, suppression, audit)
│   ├── middleware/ (auth, role, upload, errorHandler)
│   ├── models/ (User, Student, Campaign, EmailLog, EmailTemplate, Suppression, AuditLog)
│   ├── services/ (emailQueueService, excelService, auditService, schedulerService)
│   ├── sockets/ (campaignSocket)
│   ├── utils/ (seeder, validator)
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ (common, dashboard, students, composer, campaigns, templates)
│   │   ├── context/ (AuthContext, SocketContext)
│   │   ├── pages/ (Login, Dashboard, Students, BulkUpload, Composer, Templates, Campaigns, CampaignDetail, Reports, SuppressionList, AuditLogs, Users, Settings)
│   │   ├── services/ (api, studentService, campaignService, templateService, userService, reportService)
│   │   ├── utils/ (formatters, constants, exportUtils)
│   │   └── App.jsx
│   └── vite.config.js
├── documentation/
│   ├── installation-guide.md
│   ├── user-guide.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── demo-script.md
└── README.md
```

---

## Quick Start Guide

### 1. Backend Launch
```bash
cd backend
npm install
npm run seed
npm run dev
```
Backend API will start on `http://localhost:5001`.

### 2. Frontend Launch
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## Demo Accounts
- **Admin**: `admin@aparaitech.com` / `Admin@123`
- **Recruiter**: `recruiter@aparaitech.com` / `Recruiter@123`
- **Viewer**: `viewer@aparaitech.com` / `Viewer@123`

---

## Documentation
Full documentation suite is available in the `documentation/` folder:
- [Installation Guide](file:///C:/Users/Nilesh%20Rajpure/.gemini/antigravity-ide/scratch/student-email-blast/documentation/installation-guide.md)
- [User Guide](file:///C:/Users/Nilesh%20Rajpure/.gemini/antigravity-ide/scratch/student-email-blast/documentation/user-guide.md)
- [5-Minute Demo Script](file:///C:/Users/Nilesh%20Rajpure/.gemini/antigravity-ide/scratch/student-email-blast/documentation/demo-script.md)
- [Database Schema](file:///C:/Users/Nilesh%20Rajpure/.gemini/antigravity-ide/scratch/student-email-blast/documentation/database-schema.md)
- [API Documentation](file:///C:/Users/Nilesh%20Rajpure/.gemini/antigravity-ide/scratch/student-email-blast/documentation/api-documentation.md)
