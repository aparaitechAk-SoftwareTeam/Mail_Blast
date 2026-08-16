import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/common/Navbar';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchStudents, createStudent, updateStudent, deleteStudent, bulkDeleteStudents } from '../services/studentService';
import { exportToCSV } from '../utils/exportUtils';
import { Search, Plus, Trash2, Download, Edit2, Filter, UserCheck, Eye } from 'lucide-react';

import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const Students = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meta, setMeta] = useState({ colleges: [], branches: [], years: [] });

  // Filters state
  const [search, setSearch] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [placementStatus, setPlacementStatus] = useState('');

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    branch: '',
    graduationYear: 2026,
    cgpa: 8.0,
    placementStatus: 'Unplaced'
  });
  const [errors, setErrors] = useState({});

  // Confirm delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, isBulk: false });
  const [deleting, setDeleting] = useState(false);

  // View detail modal state
  const [viewStudent, setViewStudent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchStudents({
        search,
        college,
        branch,
        graduationYear,
        minCgpa,
        placementStatus,
        page,
        limit: 10
      });
      setStudents(res.students);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to fetch students database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Student Directory';
    loadData();
  }, [page, search, college, branch, graduationYear, minCgpa, placementStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errs.name = 'Please enter a valid full name (minimum 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (formData.phone) {
      const phoneRegex = /^[+\d\s\-()]{7,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        errs.phone = 'Please enter a valid phone number (10-digit format)';
      }
    }
    if (!formData.college || formData.college.trim().length < 2) {
      errs.college = 'College name is required';
    }
    if (!formData.branch || formData.branch.trim().length < 2) {
      errs.branch = 'Branch of study is required';
    }
    const year = Number(formData.graduationYear);
    if (!year || year < 2000 || year > 2035) {
      errs.graduationYear = 'Graduation year must be between 2000 and 2035';
    }
    const cgpaNum = Number(formData.cgpa);
    if (cgpaNum === undefined || cgpaNum < 0 || cgpaNum > 10) {
      errs.cgpa = 'CGPA must be a number between 0 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      college: meta.colleges[0] || 'COEP Technological University',
      branch: 'Computer Engineering',
      graduationYear: 2026,
      cgpa: 8.0,
      placementStatus: 'Unplaced'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setErrors({});
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      college: student.college,
      branch: student.branch,
      graduationYear: student.graduationYear,
      cgpa: student.cgpa,
      placementStatus: student.placementStatus
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, formData);
        toast.success('Student record updated successfully!');
      } else {
        await createStudent(formData);
        toast.success('New student added successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save student record';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteConfirm.isBulk) {
        await bulkDeleteStudents(selectedIds);
        toast.success(`Deleted ${selectedIds.length} student records`);
        setSelectedIds([]);
      } else {
        await deleteStudent(deleteConfirm.id);
        toast.success('Student record deleted');
      }
      setDeleteConfirm({ isOpen: false, id: null, isBulk: false });
      loadData();
    } catch (err) {
      toast.error('Failed to delete student record');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = students.map(s => ({
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      College: s.college,
      Branch: s.branch,
      GraduationYear: s.graduationYear,
      CGPA: s.cgpa,
      PlacementStatus: s.placementStatus
    }));
    exportToCSV(dataToExport, `students_export_${Date.now()}.csv`);
    toast.info('Exporting student directory CSV...');
  };

  return (
    <div>
      <Navbar title="Student Directory" />

      <div className="page-container">
        {/* Controls Header */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-4">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, college..."
                  icon={Search}
                  className="m-0"
                />
              </form>
            </div>

            <div className="col-12 col-md-8 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
              <Select
                name="college"
                value={college}
                onChange={(e) => { setCollege(e.target.value); setPage(1); }}
                options={meta.colleges.map(c => ({ label: c, value: c }))}
                placeholder="All Colleges"
                className="m-0 w-auto"
              />

              <Select
                name="branch"
                value={branch}
                onChange={(e) => { setBranch(e.target.value); setPage(1); }}
                options={meta.branches.map(b => ({ label: b, value: b }))}
                placeholder="All Branches"
                className="m-0 w-auto"
              />

              <Select
                name="placementStatus"
                value={placementStatus}
                onChange={(e) => { setPlacementStatus(e.target.value); setPage(1); }}
                options={[
                  { label: 'Unplaced', value: 'Unplaced' },
                  { label: 'Placed', value: 'Placed' },
                  { label: 'Internship Only', value: 'Internship Only' }
                ]}
                placeholder="All Statuses"
                className="m-0 w-auto"
              />

              <Button variant="outline" icon={Download} onClick={handleExportCSV}>
                Export CSV
              </Button>

              {user?.role !== 'Viewer' && (
                <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
                  Add Student
                </Button>
              )}
            </div>
          </div>

          {selectedIds.length > 0 && user?.role !== 'Viewer' && (
            <div className="alert alert-warning border-0 shadow-sm py-2 px-3 mt-3 mb-0 rounded-3 d-flex align-items-center justify-content-between">
              <span className="fw-semibold small">{selectedIds.length} students selected</span>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setDeleteConfirm({ isOpen: true, id: null, isBulk: true })}
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Student Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      onChange={handleSelectAll} 
                      checked={students.length > 0 && selectedIds.length === students.length}
                    />
                  </th>
                  <th>Candidate</th>
                  <th>College & Branch</th>
                  <th>Grad Year</th>
                  <th>CGPA</th>
                  <th>Placement Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="No student candidates found"
                        description="No records match your current search or filter criteria."
                        actionText={user?.role !== 'Viewer' ? "Add Candidate" : null}
                        onAction={handleOpenAddModal}
                      />
                    </td>
                  </tr>
                ) : (
                  students.map(st => (
                    <tr key={st._id}>
                      <td>
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          checked={selectedIds.includes(st._id)}
                          onChange={() => handleSelectOne(st._id)}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-7" style={{ width: '36px', height: '36px' }}>
                            {st.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{st.name}</div>
                            <div className="small text-muted">{st.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{st.college}</div>
                        <div className="small text-muted">{st.branch}</div>
                      </td>
                      <td className="fw-semibold">{st.graduationYear}</td>
                      <td>
                        <span className={`badge ${st.cgpa >= 8.5 ? 'bg-success-subtle text-success border-success-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'} border px-2 py-1 rounded-pill fw-bold`}>
                          {st.cgpa}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={st.placementStatus} type="placement" />
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button onClick={() => setViewStudent(st)} className="btn btn-sm btn-ghost-custom text-muted p-1.5" title="View Detail">
                            <Eye size={16} />
                          </button>
                          {user?.role !== 'Viewer' && (
                            <>
                              <button onClick={() => handleOpenEditModal(st)} className="btn btn-sm btn-ghost-custom text-primary p-1.5" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => setDeleteConfirm({ isOpen: true, id: st._id, isBulk: false })} className="btn btn-sm btn-ghost-custom text-danger p-1.5" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-top">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>

        {/* Add / Edit Student Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingStudent ? 'Edit Student Record' : 'Add New Candidate'}
          subtitle="Ensure student credentials match partner university rosters."
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveStudent} loading={saving}>
                Save Record
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveStudent}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                  placeholder="e.g. rahul@coep.edu.in"
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="College Name"
                  name="college"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  error={errors.college}
                  required
                  placeholder="COEP Technological University"
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="Branch of Study"
                  name="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  error={errors.branch}
                  required
                  placeholder="Computer Engineering"
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="Passout Year"
                  name="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  error={errors.graduationYear}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <Input
                  label="CGPA (0 - 10)"
                  name="cgpa"
                  type="number"
                  step="0.1"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  error={errors.cgpa}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <Select
                  label="Placement Status"
                  name="placementStatus"
                  value={formData.placementStatus}
                  onChange={(e) => setFormData({ ...formData, placementStatus: e.target.value })}
                  options={[
                    { label: 'Unplaced', value: 'Unplaced' },
                    { label: 'Placed', value: 'Placed' },
                    { label: 'Internship Only', value: 'Internship Only' },
                    { label: 'Opted Out', value: 'Opted Out' }
                  ]}
                  required
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* View Student Detail Modal */}
        <Modal
          isOpen={!!viewStudent}
          onClose={() => setViewStudent(null)}
          title="Student Candidate Profile"
          size="md"
        >
          {viewStudent && (
            <div className="p-2">
              <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4" style={{ width: '48px', height: '48px' }}>
                  {viewStudent.name?.charAt(0)}
                </div>
                <div>
                  <h5 className="fw-bold m-0 text-dark">{viewStudent.name}</h5>
                  <div className="text-muted small">{viewStudent.email}</div>
                  <div className="mt-1">
                    <StatusBadge status={viewStudent.placementStatus} type="placement" />
                  </div>
                </div>
              </div>

              <div className="row g-3 small">
                <div className="col-6">
                  <div className="text-muted">College</div>
                  <div className="fw-semibold text-dark">{viewStudent.college}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Branch</div>
                  <div className="fw-semibold text-dark">{viewStudent.branch}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Phone</div>
                  <div className="fw-semibold text-dark">{viewStudent.phone || 'N/A'}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Graduation Year</div>
                  <div className="fw-semibold text-dark">{viewStudent.graduationYear}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">CGPA</div>
                  <div className="fw-semibold text-dark">{viewStudent.cgpa}</div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null, isBulk: false })}
          onConfirm={handleConfirmDelete}
          title={deleteConfirm.isBulk ? `Delete ${selectedIds.length} Selected Students?` : 'Delete Student Record?'}
          description="Are you sure you want to delete candidate records? This cannot be undone."
          confirmText="Delete Record"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default Students;
