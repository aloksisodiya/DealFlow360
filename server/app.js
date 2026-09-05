import express from "express";
import "dotenv/config";
import db from "./config/db.js";
import apiRoutes from "./routes/routes.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend integration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/api", apiRoutes);


app.get("/", (req, res) => {
  res.json({ message: "Server is running smoothly using ES Modules!" });
});

app.get("/health/db", async (req, res) => {
  try {
    await db.raw("select 1 as ok");
    res.json({ database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({ database: "unavailable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
