import express from "express";
import LeaderboardController from "../controllers/LeaderboardController.mjs";

const leaderboardRoutes = express.Router();

leaderboardRoutes.get("/", LeaderboardController.loadLeaderboard);

leaderboardRoutes.get("/entries", LeaderboardController.getEntries);

leaderboardRoutes.post("/upload", LeaderboardController.uploadNewEntry);
leaderboardRoutes.put("/upload", LeaderboardController.updateEntry);

leaderboardRoutes.delete("/delete", LeaderboardController.deleteEntry);

export default leaderboardRoutes;