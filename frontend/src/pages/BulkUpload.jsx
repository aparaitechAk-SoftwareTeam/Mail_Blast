import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import { previewUpload, confirmImport } from '../services/studentService';
import { exportToCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Download, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const BulkUpload = () => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('valid');
  const [importing, setImporting] = useState(false);

  React.useEffect(() => {
    document.title = 'Aparaitech | Bulk Upload';
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
    }
  };

  const handleUploadPreview = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await previewUpload(formData);
      setPreviewResult(res);
      toast.success(`Parsed roster: ${res.summary.validCount} valid, ${res.summary.invalidCount} invalid`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error parsing uploaded roster file';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await confirmImport(previewResult.validRows);
      toast.success(`Successfully imported ${res.count} student records!`);
      setPreviewResult(null);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import student records');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadInvalid = () => {
    if (!previewResult || previewResult.invalidRows.length === 0) return;
    const invalidData = previewResult.invalidRows.map(r => ({
      RowNumber: r.rowNum,
      Name: r.data.name,
      Email: r.data.email,
      Phone: r.data.phone,
      College: r.data.college,
      Errors: r.errors.join('; ')
    }));
    exportToCSV(invalidData, `invalid_rows_report_${Date.now()}.csv`);
    toast.info('Downloading invalid records CSV...');
  };

  return (
    <div>
      <Navbar title="Bulk CSV / XLSX Upload Engine" />

      <div className="page-container">
        {/* Upload Drop Zone Card */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 p-md-5 mb-4">
          <div className="mb-4">
            <h5 className="fw-bold text-dark m-0">Upload Student Candidate Roster</h5>
            <p className="text-muted small m-0 mt-1">
              Select an Excel (<code>.xlsx</code>, <code>.xls</code>) or CSV (<code>.csv</code>) file with headers: <code>Name</code>, <code>Email</code>, <code>Phone</code>, <code>College</code>, <code>Branch</code>, <code>GraduationYear</code>, <code>CGPA</code>.
            </p>
          </div>

          <form onSubmit={handleUploadPreview}>
            <div className="border-2 border-dashed rounded-4 p-5 text-center bg-light position-relative mb-4 transition-all hover-border-primary" style={{ borderColor: '#CBD5E1' }}>
              <div className="p-3 bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                <FileSpreadsheet size={36} />
              </div>
              <h6 className="fw-bold text-dark mb-1">
                {file ? file.name : 'Drag & Drop CSV or Excel file here'}
              </h6>
              <p className="text-muted small m-0">
                Supported formats: CSV, XLS, XLSX (Max size: 10MB)
              </p>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange} 
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div className="d-flex justify-content-end">
              <Button
                type="submit"
                variant="primary"
                icon={UploadCloud}
                disabled={!file}
                loading={loading ? 'Parsing & Validating Roster...' : false}
              >
                Parse & Validate File
              </Button>
            </div>
          </form>
        </div>

        {/* Validation Breakdown Results */}
        {previewResult && (
          <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold text-dark m-0">Roster Parsing Breakdown</h5>
                <span className="text-muted small">Total candidate rows analyzed: {previewResult.summary.total}</span>
              </div>

              <Button
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleConfirmImport}
                disabled={previewResult.validRows.length === 0}
                loading={importing ? 'Importing Valid Records...' : false}
              >
                Import {previewResult.summary.validCount} Valid Records
              </Button>
            </div>

            {/* Metric Pills */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div 
                  onClick={() => setActiveTab('valid')}
                  className={`card border cursor-pointer transition-all ${activeTab === 'valid' ? 'border-success bg-success-subtle' : 'bg-light'}`}
                  style={{ borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div className="card-body p-3.5 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="small fw-semibold text-muted">Valid Candidate Records</div>
                      <h3 className="fw-bold m-0 text-success">{previewResult.summary.validCount}</h3>
                    </div>
                    <CheckCircle2 className="text-success" size={28} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div 
                  onClick={() => setActiveTab('invalid')}
                  className={`card border cursor-pointer transition-all ${activeTab === 'invalid' ? 'border-danger bg-danger-subtle' : 'bg-light'}`}
                  style={{ borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div className="card-body p-3.5 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="small fw-semibold text-muted">Invalid Records</div>
                      <h3 className="fw-bold m-0 text-danger">{previewResult.summary.invalidCount}</h3>
                    </div>
                    <AlertTriangle className="text-danger" size={28} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div 
                  onClick={() => setActiveTab('duplicate')}
                  className={`card border cursor-pointer transition-all ${activeTab === 'duplicate' ? 'border-warning bg-warning-subtle' : 'bg-light'}`}
                  style={{ borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div className="card-body p-3.5 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="small fw-semibold text-muted">Duplicates Detected</div>
                      <h3 className="fw-bold m-0 text-warning">{previewResult.summary.duplicateCount}</h3>
                    </div>
                    <RefreshCw className="text-warning" size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Invalid Export Button */}
            {activeTab === 'invalid' && previewResult.invalidRows.length > 0 && (
              <div className="d-flex justify-content-end mb-3">
                <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadInvalid}>
                  Download Invalid Rows CSV
                </Button>
              </div>
            )}

            {/* Preview Tables */}
            <div className="table-responsive">
              {activeTab === 'valid' && (
                <table className="table custom-table align-middle m-0">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Email</th>
                      <th>College</th>
                      <th>Branch</th>
                      <th>Grad Year</th>
                      <th>CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.validRows.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <EmptyState title="No valid records in roster" description="Fix errors in your spreadsheet and try uploading again." />
                        </td>
                      </tr>
                    ) : (
                      previewResult.validRows.map((r, i) => (
                        <tr key={i}>
                          <td className="fw-bold text-dark">{r.name}</td>
                          <td>{r.email}</td>
                          <td>{r.college}</td>
                          <td>{r.branch}</td>
                          <td>{r.graduationYear}</td>
                          <td>
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold">
                              {r.cgpa}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'invalid' && (
                <table className="table custom-table align-middle m-0">
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Candidate Name</th>
                      <th>Email</th>
                      <th>College</th>
                      <th>Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.invalidRows.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <EmptyState title="No invalid records" description="All candidate rows passed format validation perfectly!" />
                        </td>
                      </tr>
                    ) : (
                      previewResult.invalidRows.map((r, i) => (
                        <tr key={i} className="bg-danger-subtle bg-opacity-25">
                          <td className="fw-bold text-muted">#{r.rowNum}</td>
                          <td>{r.data.name || '—'}</td>
                          <td>{r.data.email || '—'}</td>
                          <td>{r.data.college || '—'}</td>
                          <td>
                            {r.errors.map((err, idx) => (
                              <span key={idx} className="badge bg-danger text-white me-1">{err}</span>
                            ))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'duplicate' && (
                <table className="table custom-table align-middle m-0">
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Candidate Name</th>
                      <th>Email</th>
                      <th>Duplicate Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.duplicateRows.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <EmptyState title="No duplicate emails detected" description="All candidates in this roster are unique." />
                        </td>
                      </tr>
                    ) : (
                      previewResult.duplicateRows.map((r, i) => (
                        <tr key={i}>
                          <td className="fw-bold text-muted">#{r.rowNum}</td>
                          <td>{r.data.name}</td>
                          <td>{r.data.email}</td>
                          <td>
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill fw-bold">
                              {r.reason}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
