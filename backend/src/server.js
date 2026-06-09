import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);
const app = createApp();

const start = async () => {
    await connectDatabase();
    app.listen(port, () => {
        console.log(`API server listening on port ${port}`);
    });
};

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
