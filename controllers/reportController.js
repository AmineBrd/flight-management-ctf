const fs = require('fs').promises;
const path = require('path');

// VULNERABLE: File upload without proper validation
// Allows execution of uploaded files
const uploadReport = async (req, res) => {
  try {
    if (!req.files || !req.files.reportFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.reportFile;
    
    // VULNERABILITY: No file type validation
    // VULNERABILITY: No file size limit
    // VULNERABILITY: Uses original filename (path traversal risk)
    // VULNERABILITY: Stores in public/uploads (executable location)
    
    const uploadDir = path.join(__dirname, '../public/uploads');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // VULNERABILITY: Direct use of user-provided filename
    const filePath = path.join(uploadDir, file.name);
    
    // VULNERABILITY: No sanitization of filename
    // VULNERABILITY: Allows overwriting existing files
    await file.mv(filePath);

    // VULNERABILITY: No permission restrictions on uploaded files
    // Files are executable by default in this location

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: file.name,
      path: `/uploads/${file.name}`,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
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


