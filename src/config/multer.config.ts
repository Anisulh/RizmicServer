import multer from "multer";
import path from "path";


export default multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("Unsupported file type!"));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5242880, //5mb
  },
});

