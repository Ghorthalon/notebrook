import multer from "multer";
import { UPLOAD_DIR } from "../config";

export const upload = multer({ dest: UPLOAD_DIR });
