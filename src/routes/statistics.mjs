import express from "express";
import StatisticsController from "../controllers/StatisticsController.mjs";

const statisticsRoutes = express.Router();

statisticsRoutes.get("/", StatisticsController.serveStatisticsPage);
statisticsRoutes.get("/data", StatisticsController.getAggregatedStats);

export default statisticsRoutes;
