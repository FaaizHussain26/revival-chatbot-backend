import { Router } from "express";
import { uploadFile, getFileStatus } from "../controller/upload.controller";
// import { authenticate } from "../middleware/auth.middleware";
import { fileupload } from "../middleware/upload.middleware";

const uploadRouter = Router();



uploadRouter.post("/", fileupload().single("file"), uploadFile);

uploadRouter.get("/:fileId", getFileStatus);

export default uploadRouter;
