import { Router } from "express";
import { upload } from "../utils/multer";
import * as FileController from "../controllers/file-controller";
import { authenticate } from "../middleware/auth";

export const router = Router({mergeParams: true});

router.post("/", authenticate, upload.single("file"), FileController.uploadFile);
router.get("/", authenticate, FileController.getFiles);
