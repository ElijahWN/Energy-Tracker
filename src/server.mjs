import express from "express";
import path from "path";
import leaderboardRoutes from "./routes/leaderboard.mjs";
import statisticRoutes from "./routes/statistics.mjs";
import locationRoutes from "./routes/locations.mjs";

const app = express();

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "/views"));

app.use("/leaderboard", leaderboardRoutes);
app.use("/statistics", statisticRoutes);
app.use("/locations", locationRoutes);

app.get("/", (req, res) => res.redirect("/locations"));

app.use(express.static("src/public"));

const port = 8080;
app.listen(port, function () {
    console.log(`Express server started on http://localhost:${port}`);
});
