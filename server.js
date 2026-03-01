const express = require("express");
const bodyParser = require("body-parser");
const { body, param, query, validationResult } = require("express-validator");

const app = express();
const PORT = 3000;
const SECRET_KEY = "danielpius1909";

app.use(bodyParser.json());

let products = []; 

//Auth
const authenticate = (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (!apiKey || apiKey !== SECRET_KEY) {
        return res.status(401).json({ 
            message: "Unauthorized: Invalid or missing API key" 
        });
    }
    next();
};

//Error Handling
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
};

// Create Method
app.post("/products",
    authenticate,
    [
        body("id").isString().withMessage("ID must be a string"),
        body("name").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
        body("price").isFloat({ min: 0 }).withMessage("Price must be positive"),
        body("description").notEmpty().withMessage("Description is required"),
        body("category").notEmpty().withMessage("Category is required"),
        body("stockQuantity").isInt({ min: 0 }).withMessage("Stock must be >= 0")
    ],
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id, name, price, description, category, stockQuantity } = req.body;

        if (products.some(p => p.id === id)) {
            return res.status(409).json({ message: "Product with this ID already exists" });
        }

        const product = { id, name, price, description, category, stockQuantity };
        products.push(product);

        res.status(201).json({ message: "Product created", product });
    }
);

//Get All
app.get("/products", authenticate, (req, res) => {

    let result = [...products];

    if (req.query.category) {
        result = result.filter(p => p.category === req.query.category);
    }

    if (req.query.search) {
        result = result.filter(p =>
            p.name.toLowerCase().includes(req.query.search.toLowerCase())
        );
    }

    res.json(result);
});

//Get by ID
app.get("/products/:id",
    authenticate,
    [param("id").notEmpty().withMessage("ID is required")],
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const product = products.find(p => p.id === req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    }
);

//Put Method
app.put("/products/:id",
    authenticate,
    [
        param("id").notEmpty().withMessage("ID is required"),
        body("price").optional().isFloat({ min: 0 }),
        body("stockQuantity").optional().isInt({ min: 0 })
    ],
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: "Product not found" });
        }

        products[index] = { ...products[index], ...req.body };

        res.json({ message: "Product updated", product: products[index] });
    }
);

//Delete method
app.delete("/products/:id",
    authenticate,
    [param("id").notEmpty().withMessage("ID is required")],
    (req, res) => {

        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: "Product not found" });
        }

        products.splice(index, 1);

        res.json({ message: "Product deleted" });
    }
);

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});