import './bootstrap';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/'
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    res.json({
      success: true,
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload gagal'
    });
  }
});

app.listen(8000, () => {
  console.log('Server running on port 8000');
});