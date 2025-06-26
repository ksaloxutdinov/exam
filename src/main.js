import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import adminRouter from "./routes/admin.route.js";
import salesmanRouter from "./routes/salesman.route.js";
import clientRouter from "./routes/client.route.js";
import categoryRouter from "./routes/category.route.js";
import productRouter from "./routes/product.route.js";
import soldProductRouter from "./routes/sold-product.route.js";
import { connectDB } from "./database/index.js";

const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDB();

app.use('/api/admin', adminRouter);
app.use('/api/salesman', salesmanRouter);
app.use('/api/client', clientRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/sold-product', soldProductRouter);

app.listen(config.PORT, () => {
    console.log(`Server is running on http://localhost:${config.PORT}/`);
});