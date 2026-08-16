# REST API Documentation

All API endpoints are prefixed with `/api`. Bearer Token authentication header is required for protected endpoints: `Authorization: Bearer <JWT>`.

## Authentication
- `POST /api/auth/login` - Authenticate user credentials & receive JWT token
- `GET /api/auth/me` - Fetch logged-in user profile

## Students
- `GET /api/students` - Query students with search, filters & pagination
- `POST /api/students` - Create individual student record (Admin, Recruiter)
- `PUT /api/students/:id` - Update student record (Admin, Recruiter)
- `DELETE /api/students/:id` - Delete student record (Admin, Recruiter)
- `DELETE /api/students/bulk-delete` - Bulk delete students (Admin, Recruiter)

## CSV / XLSX Upload Engine
- `POST /api/upload/preview` - Upload `.csv` / `.xlsx` file for validation breakdown
- `POST /api/upload/confirm` - Import validated student rows into database

## Campaigns & Dispatch Queue
- `GET /api/campaigns` - List campaign history
- `GET /api/campaigns/:id` - Get campaign metrics & recipient log details
- `POST /api/campaigns` - Draft new email campaign with target criteria
- `POST /api/campaigns/:id/launch` - Start email queue batch dispatch
- `POST /api/campaigns/:id/retry` - Re-queue failed recipient logs
- `POST /api/campaigns/send-test` - Dispatch test email preview

## Templates
- `GET /api/templates` - Fetch pre-built and custom templates
- `POST /api/templates` - Create new template
- `DELETE /api/templates/:id` - Remove custom template

## Reports & System Administration
- `GET /api/reports/dashboard` - Overview statistics & college distribution
- `GET /api/reports/detailed` - Detailed performance analytics
- `GET /api/suppressions` - Fetch opt-out suppression list
- `POST /api/suppressions` - Add manual email opt-out
- `GET /api/audit-logs` - Query audit logs (Admin only)
- `GET /api/users` - Manage recruiter accounts (Admin only)
