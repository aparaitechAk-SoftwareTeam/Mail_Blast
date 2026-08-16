# 5-Minute Evaluation & Demo Script

## Step 1: Login & RBAC Verification (1 min)
1. Navigate to `http://localhost:3000/login`.
2. Click the **Admin** quick login button (`admin@aparaitech.com` / `Admin@123`).
3. Note the full admin menu (Student Directory, CSV Import, Email Blast Composer, Audit Logs, Recruiter Accounts).
4. Log out and sign in as **Viewer** (`viewer@aparaitech.com` / `Viewer@123`) to verify restricted actions (cannot create campaigns or edit records).

## Step 2: Student Directory & CSV Import (1 min)
1. Sign back in as **Recruiter** (`recruiter@aparaitech.com` / `Recruiter@123`).
2. Go to **Student Directory**, search for "COEP" or filter by Branch "Computer Engineering".
3. Navigate to **CSV / XLSX Import** page. Upload a sample file and observe the 3-pill validation breakdown (Valid, Invalid, Duplicates).
4. Download the invalid rows report and click **Import Valid Records**.

## Step 3: Composer & Responsive Preview (1 min)
1. Open **New Email Blast** composer.
2. Select pre-built template **"Campus Placement Drive 2026"**.
3. Observe inserted personalization chips (`{Name}`, `{College}`, `{CGPA}`).
4. Click **Live Device Preview** and switch between **Desktop** and **Mobile** viewports.
5. Click **Send Test Email** to send a test preview to your inbox.

## Step 4: Bulk Campaign & Live WebSocket Progress (1 min)
1. Click **Create & Review Campaign**.
2. Click **Dispatch Email Blast Now**.
3. Watch the progress bar fill up in real time via Socket.IO events while sent/failed counts update live.

## Step 5: Retry Failed & Reports (1 min)
1. Click **Retry Failed Emails** on any campaign with failed records to verify re-queueing behavior.
2. Go to **Analytics Reports** to view interactive Recharts graphs and export the full CSV report.
