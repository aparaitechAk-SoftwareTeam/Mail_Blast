const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const EmailTemplate = require('../models/EmailTemplate');
const Suppression = require('../models/Suppression');
const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const { getIsConnected, getMemoryStore } = require('../config/db');

const defaultTemplates = [
  {
    name: 'Campus Placement Drive 2026',
    category: 'Placement Drive',
    subject: 'Aparaitech Software Campus Placement Drive 2026 - Invitation for {Name}',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="background: linear-gradient(135deg, #4F46E5, #3B82F6); padding: 20px; text-align: center; color: #ffffff; border-radius: 6px 6px 0 0;">
    <h2 style="margin: 0; font-size: 22px;">Aparaitech Software Placement Drive 2026</h2>
  </div>
  <div style="padding: 20px; color: #333333; line-height: 1.6;">
    <p>Dear <strong>{Name}</strong>,</p>
    <p>We are delighted to invite students from <strong>{College}</strong> ({Branch}, Batch of {GraduationYear}) to participate in Aparaitech Software's upcoming Campus Recruitment Drive.</p>
    <p><strong>Position:</strong> Associate Software Engineer / Full Stack Developer</p>
    <p><strong>Package:</strong> ₹6.5 LPA - ₹10.0 LPA</p>
    <p><strong>Minimum CGPA Criteria:</strong> 7.0 (Current recorded: {CGPA})</p>
    <div style="background: #f8fafc; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Date:</strong> August 25, 2026</p>
      <p style="margin: 5px 0 0 0;"><strong>Venue / Mode:</strong> Hybrid / Online Coding Assessment followed by Technical Interviews</p>
    </div>
    <p>Please confirm your registration by clicking below:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://aparaitech.com/careers/campus-2026" style="background: #4F46E5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Register for Drive</a>
    </div>
    <p>Best regards,<br/><strong>Aparaitech Software Recruitment Team</strong><br/>Email: recruitment@aparaitech.com</p>
  </div>
</div>`,
    description: 'Standard campus placement drive notification template with CTA button',
    isPrebuilt: true
  },
  {
    name: 'Summer Internship Opportunity 2026',
    category: 'Internship Opportunity',
    subject: 'Software Engineering Internship Opportunity at Aparaitech - {Name}',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center; color: #ffffff; border-radius: 6px 6px 0 0;">
    <h2 style="margin: 0; font-size: 22px;">Summer Internship Program 2026</h2>
  </div>
  <div style="padding: 20px; color: #333333; line-height: 1.6;">
    <p>Hello <strong>{Name}</strong>,</p>
    <p>Aparaitech Software is seeking talented <strong>{Branch}</strong> students from <strong>{College}</strong> for our 6-Month Paid Engineering Internship Program.</p>
    <ul>
      <li>Stipend: ₹25,000 / month</li>
      <li>PPO Opportunity based on performance</li>
      <li>Mentorship by Senior Staff Engineers</li>
    </ul>
    <p>Applications close next Friday. Don't miss this opportunity to kickstart your tech career!</p>
    <p>Warm regards,<br/>Aparaitech Early Talent Team</p>
  </div>
</div>`,
    description: 'Tailored internship application drive announcement',
    isPrebuilt: true
  },
  {
    name: 'Technical Interview Invitation',
    category: 'Interview Invitation',
    subject: 'Interview Schedule: Aparaitech Software - {Name}',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); padding: 20px; text-align: center; color: #ffffff; border-radius: 6px 6px 0 0;">
    <h2 style="margin: 0; font-size: 22px;">Technical Interview Scheduled</h2>
  </div>
  <div style="padding: 20px; color: #333333; line-height: 1.6;">
    <p>Dear <strong>{Name}</strong>,</p>
    <p>Congratulations! Based on your academic record at <strong>{College}</strong> (CGPA: {CGPA}), you have been shortlisted for Round 1 Technical Interview.</p>
    <p><strong>Interview Details:</strong></p>
    <ul>
      <li><strong>Format:</strong> Video Call (Google Meet)</li>
      <li><strong>Duration:</strong> 45 Minutes</li>
      <li><strong>Focus:</strong> Data Structures, Algorithms, System Logic</li>
    </ul>
    <p>Please reply to this email to confirm your availability.</p>
    <p>Best of luck,<br/>Aparaitech Technical Hiring Team</p>
  </div>
</div>`,
    description: 'Personalized shortlist interview invitation template',
    isPrebuilt: true
  }
];

const sampleStudents = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@coep.edu.in', phone: '+91 9876543210', college: 'COEP Technological University', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 8.9, placementStatus: 'Unplaced', skills: ['React', 'Node.js', 'Python'] },
  { name: 'Priya Patel', email: 'priya.patel@vjti.ac.in', phone: '+91 9876543211', college: 'VJTI Mumbai', branch: 'Information Technology', graduationYear: 2026, cgpa: 9.2, placementStatus: 'Unplaced', skills: ['Java', 'Spring Boot', 'SQL'] },
  { name: 'Aarav Gupta', email: 'aarav.g@pict.edu', phone: '+91 9876543212', college: 'Pune Institute of Computer Technology', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 8.4, placementStatus: 'Unplaced', skills: ['C++', 'Go', 'Docker'] },
  { name: 'Ananya Verma', email: 'ananya.v@mitwpu.edu.in', phone: '+91 9876543213', college: 'MIT World Peace University', branch: 'Data Science', graduationYear: 2026, cgpa: 8.1, placementStatus: 'Unplaced', skills: ['Python', 'TensorFlow', 'PostgreSQL'] },
  { name: 'Siddharth Nair', email: 'siddharth.n@vit.ac.in', phone: '+91 9876543214', college: 'VIT Pune', branch: 'Electronics & Telecom', graduationYear: 2026, cgpa: 7.8, placementStatus: 'Unplaced', skills: ['Embedded C', 'Python', 'React'] },
  { name: 'Neha Kulkarni', email: 'neha.k@coep.edu.in', phone: '+91 9876543215', college: 'COEP Technological University', branch: 'Information Technology', graduationYear: 2026, cgpa: 9.5, placementStatus: 'Placed', skills: ['TypeScript', 'Next.js', 'AWS'] },
  { name: 'Aditya Joshi', email: 'aditya.j@vjti.ac.in', phone: '+91 9876543216', college: 'VJTI Mumbai', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 8.7, placementStatus: 'Internship Only', skills: ['Node.js', 'MongoDB', 'Flutter'] },
  { name: 'Sneha Deshmukh', email: 'sneha.d@pict.edu', phone: '+91 9876543217', college: 'Pune Institute of Computer Technology', branch: 'Information Technology', graduationYear: 2026, cgpa: 8.3, placementStatus: 'Unplaced', skills: ['Java', 'Microservices', 'Git'] },
  { name: 'Rohan Mehta', email: 'rohan.m@spit.ac.in', phone: '+91 9876543218', college: 'Sardar Patel Institute of Technology', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 9.1, placementStatus: 'Unplaced', skills: ['React', 'Express', 'Redis'] },
  { name: 'Kavya Singh', email: 'kavya.s@spit.ac.in', phone: '+91 9876543219', college: 'Sardar Patel Institute of Technology', branch: 'Data Engineering', graduationYear: 2026, cgpa: 8.6, placementStatus: 'Unplaced', skills: ['Python', 'Spark', 'SQL'] }
];

const seedData = async () => {
  const isMongo = getIsConnected();
  const store = getMemoryStore();

  const hashedAdminPass = await bcrypt.hash('Admin@123', 10);
  const hashedRecruiterPass = await bcrypt.hash('Recruiter@123', 10);
  const hashedViewerPass = await bcrypt.hash('Viewer@123', 10);

  const usersToSeed = [
    { name: 'Admin User', email: 'admin@aparaitech.com', password: hashedAdminPass, role: 'Admin', department: 'Executive Talent Acquisition' },
    { name: 'Lead Recruiter', email: 'recruiter@aparaitech.com', password: hashedRecruiterPass, role: 'Recruiter', department: 'Campus Hiring' },
    { name: 'Placement Inspector', email: 'viewer@aparaitech.com', password: hashedViewerPass, role: 'Viewer', department: 'Audit & Compliance' }
  ];

  if (isMongo) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.insertMany(usersToSeed);
        console.log('Seeded Users into MongoDB');
      }

      const studentCount = await Student.countDocuments();
      if (studentCount === 0) {
        await Student.insertMany(sampleStudents);
        console.log('Seeded Sample Students into MongoDB');
      }

      const templateCount = await EmailTemplate.countDocuments();
      if (templateCount === 0) {
        await EmailTemplate.insertMany(defaultTemplates);
        console.log('Seeded Email Templates into MongoDB');
      }

      const suppressionCount = await Suppression.countDocuments();
      if (suppressionCount === 0) {
        await Suppression.create({ email: 'optout.student@example.com', reason: 'Manual Opt-Out', notes: 'Student requested no placement emails' });
      }
    } catch (err) {
      console.error('Seeding MongoDB Error:', err.message);
    }
  } else {
    // Populate in-memory store
    if (store.users.length === 0) {
      store.users = usersToSeed.map((u, i) => ({ ...u, _id: `u-${i+1}`, active: true, createdAt: new Date() }));
    }
    if (store.students.length === 0) {
      store.students = sampleStudents.map((s, i) => ({ ...s, _id: `st-${i+1}`, isSubscribed: true, createdAt: new Date() }));
    }
    if (store.templates.length === 0) {
      store.templates = defaultTemplates.map((t, i) => ({ ...t, _id: `tpl-${i+1}`, createdAt: new Date() }));
    }
    if (store.suppressions.length === 0) {
      store.suppressions.push({ _id: 'sup-1', email: 'optout.student@example.com', reason: 'Manual Opt-Out', addedBy: 'System', notes: 'Student requested no placement emails', createdAt: new Date() });
    }
    console.log('Seeded In-Memory Fallback Database Store');
  }
};

module.exports = { seedData };
