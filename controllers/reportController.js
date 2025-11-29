const fs = require('fs').promises;
const path = require('path');

// Helper function to read reports
const getReportsData = async () => {
  const reportsPath = path.join(__dirname, '../data/reports/reports.json');
  try {
    const data = await fs.readFile(reportsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Helper function to save reports
const saveReportsData = async (reports) => {
  const reportsPath = path.join(__dirname, '../data/reports/reports.json');
  await fs.mkdir(path.dirname(reportsPath), { recursive: true });
  await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2));
};

// VULNERABLE: File upload without proper validation
// Allows execution of uploaded files and path traversal attacks
const uploadReport = async (req, res) => {
  try {
    if (!req.files || !req.files.reportFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.body.name || req.body.name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const file = req.files.reportFile;
    const name = req.body.name.trim();
    const description = req.body.description ? req.body.description.trim() : '';
    
    // VULNERABILITY: No file type validation
    // VULNERABILITY: No file size limit
    // VULNERABILITY: Uses user-provided filename directly (path traversal risk)
    // VULNERABILITY: Stores in public/uploads (executable location)
    
    // CRITICAL VULNERABILITY: Direct use of user-provided filename without sanitization
    // Allows path traversal attacks like ../../../../../../../exploit.php
    // VULNERABILITY: No path traversal protection
    // VULNERABILITY: No sanitization - allows ../ sequences
    // VULNERABILITY: Direct path.join with user input enables directory traversal
    
    const uploadDir = path.join(__dirname, '../public/uploads');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // CRITICAL VULNERABILITY: Using user-provided filename directly in path.join
    // This allows path traversal: ../../../../../../../exploit.php
    // The path.join will resolve the .. sequences and write outside uploads directory
    const filePath = path.join(uploadDir, name);
    
    // VULNERABILITY: No validation that filePath is within uploadDir
    // VULNERABILITY: No sanitization of filename
    // VULNERABILITY: Allows overwriting existing files anywhere on the system
    await file.mv(filePath);

    // VULNERABILITY: No permission restrictions on uploaded files
    // Files are executable by default in this location

    // Save report metadata to reports.json
    const reports = await getReportsData();
    const newReport = {
      id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
      name: name,
      description: description,
      originalFilename: file.name,
      size: file.size,
      path: `/uploads/${name}`,
      actualPath: filePath,
      uploaded: new Date().toISOString(),
      uploadedBy: req.user.email
    };
    
    reports.push(newReport);
    await saveReportsData(reports);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
};

// Get all uploaded reports
const getReports = async (req, res) => {
  try {
    const reports = await getReportsData();

    res.render('pages/admin/reports', {
      reports: reports,
      user: req.user,
      title: 'Reports - Admin'
    });
  } catch (error) {
    console.error('Error loading reports:', error);
    res.render('error', {
      message: 'Error loading reports',
      title: 'Error'
    });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reports = await getReportsData();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];
    
    // VULNERABILITY: No validation of filename (path traversal risk)
    // Delete the physical file
    try {
      const filePath = report.actualPath || path.join(__dirname, '../public/uploads', report.name);
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue even if file deletion fails
    }

    // Remove from reports.json
    reports.splice(reportIndex, 1);
    await saveReportsData(reports);

    res.redirect('/admin/reports');
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

module.exports = {
  uploadReport,
  getReports,
  deleteReport
};


