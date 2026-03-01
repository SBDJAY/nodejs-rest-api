const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv")
const { body, param, query, validationResult } = require("express-validator");

dotenv.config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

app.use(bodyParser.json());

mongoose.connect(MONGO_URI)
.then(() => console.log("Connected to the DB"))
.catch(err => console.error("Mongo connection error: ", err))

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    stockQuantity: { type: Number, required: true }
});

const Product = mongoose.model("Product", productSchema);

const authenticate = (req, res, next) => {
    const apiKey = req.header("x-api-key");

    if (!apiKey || apiKey !== SECRET_KEY) {
        return res.status(401).json({
            message: "Unauthorized: Invalid or missing API key"
        });
    }

    next();
};

app.post("/products",
    authenticate,
    async (req, res) => {

        try {
            const product = new Product(req.body);
            await product.save();

            res.status(201).json({
                message: "Product created",
                product
            });

        } catch (err) {
            res.status(400).json({
                message: "Error creating product",
                error: err.message
            });
        }
    }
);

app.get("/products", authenticate, async (req, res) => {

    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({
            message: "Error retrieving products",
            error: err.message
        });
    }
});

app.get("/products/:id", authenticate, async (req, res) => {

    try {
        const product = await Product.findOne({ id: req.params.id });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);

    } catch (err) {
        res.status(400).json({
            message: "Error retrieving product",
            error: err.message
        });
    }
});

app.delete("/products/:id", authenticate, async (req, res) => {

    try {
        const result = await Product.deleteOne({ id: req.params.id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted" });

    } catch (err) {
        res.status(400).json({
            message: "Error deleting product",
            error: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});