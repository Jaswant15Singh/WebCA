import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};


const createUploader = (
  folder,
  mimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeMB = 5,
) => {
  const dest = path.join("public", "uploads", folder);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),

    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;      
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    if (mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type "${file.mimetype}". Allowed: ${mimeTypes.join(", ")}`,
        ),
        false,
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};


const clientUploader = createUploader("clients");

const projectUploader = createUploader("projects");

const uploadClientImage = clientUploader.single("avatar_url");
const uploadClientImages = clientUploader.array("avatar_url", 10);

const uploadProjectImage = projectUploader.single("image");
const uploadProjectImages = projectUploader.array("images", 10);

// const multerErrorHandler = (err, _req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: err.message });
//   }
//   if (err) {
//     return res.status(422).json({ error: err.message });
//   }
//   next();
// };

export {
  clientUploader,
  projectUploader,
  uploadClientImage,
  uploadClientImages,
  uploadProjectImage,
  uploadProjectImages,
//   multerErrorHandler,
  createUploader,
};
