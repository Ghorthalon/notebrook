import { Router } from "express";
import * as SearchController from "../controllers/search-controller";
import { authenticate } from "../middleware/auth";

export const router = Router({mergeParams: true});

router.get("/", authenticate, SearchController.search);
