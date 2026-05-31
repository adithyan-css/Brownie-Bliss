import { Router, type IRouter } from "express";
import healthRouter from "./health";
import brownieRouter from "./brownie";

const router: IRouter = Router();

router.use(healthRouter);
router.use(brownieRouter);

export default router;
