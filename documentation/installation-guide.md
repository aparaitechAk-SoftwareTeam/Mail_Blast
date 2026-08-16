# Aparaitech Student Email Blast - Installation Guide

This guide covers setup and local execution instructions for the Student Email Blast Web Application.

## Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)
- (Optional) MongoDB local service or MongoDB Atlas cluster. *Note: The application automatically switches to a zero-config fallback in-memory store if MongoDB is not running.*

## 1. Backend Setup
```bash
cd backend
npm install
npm run seed   # Seed default accounts, templates, and sample students
npm run dev    # Starts backend server on http://localhost:5001
```

## 2. Frontend Setup
Open a separate terminal:
```bash
cd frontend
npm install
npm run dev    # Starts Vite frontend on http://localhost:3000
```

## 3. Demo Credentials
- **Admin**: `admin@aparaitech.com` / `Admin@123`
- **Recruiter**: `recruiter@aparaitech.com` / `Recruiter@123`
- **Viewer**: `viewer@aparaitech.com` / `Viewer@123`
