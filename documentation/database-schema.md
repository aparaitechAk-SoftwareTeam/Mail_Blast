# Database Schema Documentation

## Schemas & Relationships

### 1. User Schema
- `name`: String (Required)
- `email`: String (Required, Unique, Lowercase)
- `password`: String (Bcrypt Hashed)
- `role`: Enum ['Admin', 'Recruiter', 'Viewer']
- `department`: String
- `lastLogin`: Date

### 2. Student Schema
- `name`: String (Required)
- `email`: String (Required, Unique, Lowercase)
- `phone`: String
- `college`: String (Indexed)
- `branch`: String (Indexed)
- `graduationYear`: Number (Indexed)
- `cgpa`: Number (Indexed, Min: 0, Max: 10)
- `placementStatus`: Enum ['Unplaced', 'Placed', 'Internship Only', 'Opted Out']
- `isSubscribed`: Boolean (Default: true)

### 3. Campaign Schema
- `title`: String (Required)
- `subject`: String (Required)
- `bodyHtml`: String (Required)
- `templateId`: ObjectId (Ref: EmailTemplate)
- `createdBy`: ObjectId (Ref: User)
- `targetFilters`: Object (college, branch, graduationYear, minCgpa, placementStatus)
- `status`: Enum ['Draft', 'Scheduled', 'Sending', 'Completed', 'Failed', 'Cancelled']
- `scheduledAt`: Date
- `totalRecipients`: Number
- `sentCount`: Number
- `failedCount`: Number

### 4. EmailLog Schema
- `campaignId`: ObjectId (Ref: Campaign)
- `studentId`: ObjectId (Ref: Student)
- `recipientEmail`: String
- `recipientName`: String
- `status`: Enum ['Pending', 'Sent', 'Failed', 'Suppressed', 'Retried']
- `errorMessage`: String
- `sentAt`: Date

### 5. EmailTemplate Schema
- `name`: String (Required)
- `category`: Enum ['Placement Drive', 'Internship Opportunity', 'Job Opportunity', 'Interview Invitation', 'Interview Shortlist', 'Campus Recruitment']
- `subject`: String
- `bodyHtml`: String
- `isPrebuilt`: Boolean

### 6. Suppression Schema
- `email`: String (Unique)
- `reason`: Enum ['Unsubscribed', 'Bounced', 'Spam Complaint', 'Manual Opt-Out']
- `addedBy`: String

### 7. AuditLog Schema
- `action`: String
- `userEmail`: String
- `userRole`: String
- `details`: String
- `targetEntity`: String
- `createdAt`: Date (Indexed)
