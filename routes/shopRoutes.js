const shopController = require("../controllers/shopController");
const isAuth = require("../middleware/is-auth");

const express = require("express");

const router = express.Router();

router.get("/", shopController.getAllProducts);

router.get("/get-product/:productId", shopController.getProduct);

router.get("/cart", isAuth, shopController.getCart);

router.get("/add-cart/:productId", isAuth, shopController.postCart);

router.get("/remove-cart/:productId", isAuth, shopController.getRemoveFromCart);

router.get("/create-order", isAuth, shopController.postOrder);

router.get("/orders", isAuth, shopController.getOrders);

router.get("/clear-orders", isAuth, shopController.clearOrders);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
