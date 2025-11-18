import { Router } from "express";
import { getStatus, refreshOthers } from "../controller/scrape.controller";

const router = Router();

router.post("/refresh-others", refreshOthers);

router.get("/status", getStatus);

export default router;
