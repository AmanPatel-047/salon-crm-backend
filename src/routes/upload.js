const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    res.json({ success: true, data: { url: req.file.path, public_id: req.file.filename } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Server error during upload' });
  }
});
module.exports = router;