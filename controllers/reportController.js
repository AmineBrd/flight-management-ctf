const fs = require('fs').promises;
const path = require('path');

// VULNERABLE: File upload without proper validation
// Allows execution of uploaded files and path traversal attacks
const uploadReport = async (req, res) => {
  try {
    if (!req.files || !req.files.reportFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.reportFile;
    
    // VULNERABILITY: No file type validation
    // VULNERABILITY: No file size limit
    // VULNERABILITY: Uses user-provided filename directly (path traversal risk)
    // VULNERABILITY: Stores in public/uploads (executable location)
    
    // CRITICAL VULNERABILITY: Direct use of user-provided filename without sanitization
    // Allows path traversal attacks like ../../../../../../../exploit.php
    const customFilename = req.body.customFilename && req.body.customFilename.trim() !== '' 
      ? req.body.customFilename.trim() 
      : file.name;
    
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
    const filePath = path.join(uploadDir, customFilename);
    
    // VULNERABILITY: No validation that filePath is within uploadDir
    // VULNERABILITY: No sanitization of filename
    // VULNERABILITY: Allows overwriting existing files anywhere on the system
    await file.mv(filePath);

    // VULNERABILITY: No permission restrictions on uploaded files
    // Files are executable by default in this location

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: customFilename,
      path: `/uploads/${customFilename}`,
      size: file.size,
      actualPath: filePath // For debugging - shows where file was actually saved
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
};

// Get all uploaded reports
const getReports = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../public/uploads');
    
    try {
      const files = await fs.readdir(uploadDir);
      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          return {
            name: filename,
            size: stats.size,
            uploaded: stats.mtime,
            path: `/uploads/${filename}`
          };
        })
      );

      res.render('pages/admin/reports', {
        reports: fileDetails,
        user: req.user,
        title: 'Reports - Admin'
      });
    } catch (err) {
      // Directory doesn't exist or is empty
      res.render('pages/admin/reports', {
        reports: [],
        user: req.user,
        title: 'Reports - Admin'
      });
    }
  } catch (error) {
    res.render('error', {
      message: 'Error loading reports',
      title: 'Error'
    });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    // VULNERABILITY: No validation of filename (path traversal risk)
    const filename = req.params.filename;
    const uploadDir = path.join(__dirname, '../public/uploads');
    const filePath = path.join(uploadDir, filename);

    await fs.unlink(filePath);
    res.redirect('/admin/reports');
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

module.exports = {
  uploadReport,
  getReports,
  deleteReport
};


