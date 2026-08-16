const Student = require('../models/Student');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getStudents = async (req, res) => {
  try {
    const { 
      search = '', 
      college = '', 
      branch = '', 
      graduationYear = '', 
      minCgpa = '', 
      maxCgpa = '', 
      placementStatus = '', 
      page = 1, 
      limit = 10 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (college) query.college = college;
      if (branch) query.branch = branch;
      if (graduationYear) query.graduationYear = parseInt(graduationYear);
      if (placementStatus) query.placementStatus = placementStatus;

      if (minCgpa || maxCgpa) {
        query.cgpa = {};
        if (minCgpa) query.cgpa.$gte = parseFloat(minCgpa);
        if (maxCgpa) query.cgpa.$lte = parseFloat(maxCgpa);
      }

      const total = await Student.countDocuments(query);
      const students = await Student.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const colleges = await Student.distinct('college');
      const branches = await Student.distinct('branch');
      const years = await Student.distinct('graduationYear');

      return res.json({
        students,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        meta: { colleges, branches, years }
      });
    } else {
      let filtered = [...store.students];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(st => 
          st.name.toLowerCase().includes(s) || 
          st.email.toLowerCase().includes(s) || 
          (st.phone && st.phone.includes(s))
        );
      }

      if (college) filtered = filtered.filter(st => st.college === college);
      if (branch) filtered = filtered.filter(st => st.branch === branch);
      if (graduationYear) filtered = filtered.filter(st => st.graduationYear === parseInt(graduationYear));
      if (placementStatus) filtered = filtered.filter(st => st.placementStatus === placementStatus);
      if (minCgpa) filtered = filtered.filter(st => st.cgpa >= parseFloat(minCgpa));
      if (maxCgpa) filtered = filtered.filter(st => st.cgpa <= parseFloat(maxCgpa));

      const total = filtered.length;
      const startIndex = (pageNum - 1) * limitNum;
      const students = filtered.slice(startIndex, startIndex + limitNum);

      const colleges = [...new Set(store.students.map(s => s.college))];
      const branches = [...new Set(store.students.map(s => s.branch))];
      const years = [...new Set(store.students.map(s => s.graduationYear))];

      return res.json({
        students,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        meta: { colleges, branches, years }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, phone, college, branch, graduationYear, cgpa, placementStatus, skills } = req.body;

    if (!name || !email || !college || !branch) {
      return res.status(400).json({ message: 'Name, email, college, and branch are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let existing;
    if (isMongo) {
      existing = await Student.findOne({ email: cleanEmail });
    } else {
      existing = store.students.find(s => s.email.toLowerCase() === cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ message: 'A student with this email address already exists' });
    }

    const newStudentData = {
      name,
      email: cleanEmail,
      phone: phone || '',
      college,
      branch,
      graduationYear: parseInt(graduationYear) || 2026,
      cgpa: parseFloat(cgpa) || 7.5,
      placementStatus: placementStatus || 'Unplaced',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : [])
    };

    let student;
    if (isMongo) {
      student = await Student.create(newStudentData);
    } else {
      student = { _id: `st-${Date.now()}`, ...newStudentData, isSubscribed: true, createdAt: new Date() };
      store.students.unshift(student);
    }

    logAudit({
      action: 'CREATE_STUDENT',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Added student ${name} (${cleanEmail})`,
      targetEntity: student._id
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let student;
    if (isMongo) {
      student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    } else {
      const idx = store.students.findIndex(s => String(s._id) === String(id));
      if (idx !== -1) {
        store.students[idx] = { ...store.students[idx], ...req.body };
        student = store.students[idx];
      }
    }

    if (!student) return res.status(404).json({ message: 'Student not found' });

    logAudit({
      action: 'UPDATE_STUDENT',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Updated student record for ${student.name}`,
      targetEntity: id
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await Student.findByIdAndDelete(id);
    } else {
      store.students = store.students.filter(s => String(s._id) !== String(id));
    }

    logAudit({
      action: 'DELETE_STUDENT',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Deleted student ID ${id}`,
      targetEntity: id
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of student IDs to delete' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await Student.deleteMany({ _id: { $in: ids } });
    } else {
      const idStrings = ids.map(String);
      store.students = store.students.filter(s => !idStrings.includes(String(s._id)));
    }

    logAudit({
      action: 'BULK_DELETE_STUDENTS',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Bulk deleted ${ids.length} student records`
    });

    res.json({ message: `Successfully deleted ${ids.length} students` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudents, createStudent, updateStudent, deleteStudent, bulkDeleteStudents };
