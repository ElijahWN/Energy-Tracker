import express from "express";
import LocationsController from "../controllers/LocationsController.mjs";

const locationRoutes = express.Router();

locationRoutes.get("/", LocationsController.serveListPage);
locationRoutes.get("/edit", LocationsController.serveEditPage);
locationRoutes.get("/statistics", LocationsController.serveStatsPage);
locationRoutes.get("/appliances", LocationsController.getApplianceTypes);
locationRoutes.get("/regions", LocationsController.getRegions);

export default locationRoutes;
