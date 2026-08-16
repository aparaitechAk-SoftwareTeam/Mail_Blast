const Student = require('../models/Student');
const { parseAndValidateFile } = require('../services/excelService');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const previewUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV or Excel file uploaded' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();
    let existingEmails = [];

    if (isMongo) {
      const students = await Student.find({}, 'email');
      existingEmails = students.map(s => s.email);
    } else {
      existingEmails = store.students.map(s => s.email);
    }

    const result = parseAndValidateFile(req.file.buffer, req.file.mimetype, existingEmails);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmImport = async (req, res) => {
  try {
    const { validStudents } = req.body;
    if (!Array.isArray(validStudents) || validStudents.length === 0) {
      return res.status(400).json({ message: 'No valid students provided for import' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let importedCount = 0;

    if (isMongo) {
      const docs = validStudents.map(st => ({
        name: st.name,
        email: st.email.toLowerCase().trim(),
        phone: st.phone || '',
        college: st.college || 'Unspecified',
        branch: st.branch || 'General',
        graduationYear: parseInt(st.graduationYear) || 2026,
        cgpa: parseFloat(st.cgpa) || 7.0,
        placementStatus: st.placementStatus || 'Unplaced'
      }));

      const inserted = await Student.insertMany(docs, { ordered: false });
      importedCount = inserted.length;
    } else {
      validStudents.forEach(st => {
        const studentObj = {
          _id: `st-imp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: st.name,
          email: st.email.toLowerCase().trim(),
          phone: st.phone || '',
          college: st.college || 'Unspecified',
          branch: st.branch || 'General',
          graduationYear: parseInt(st.graduationYear) || 2026,
          cgpa: parseFloat(st.cgpa) || 7.0,
          placementStatus: st.placementStatus || 'Unplaced',
          isSubscribed: true,
          createdAt: new Date()
        };
        store.students.unshift(studentObj);
        importedCount++;
      });
    }

    logAudit({
      action: 'BULK_IMPORT_STUDENTS',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Imported ${importedCount} student records via CSV/XLSX file upload`
    });

    res.json({
      message: `Successfully imported ${importedCount} student records`,
      count: importedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { previewUpload, confirmImport };
