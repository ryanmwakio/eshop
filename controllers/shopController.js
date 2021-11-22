const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");

exports.getAllProducts = (req, res, next) => {
  Product.find()
    .populate("userId")
    .then((results) => {
      res.render("shop", { title: "E-SHOP", products: results, path: "/" });
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      res.render("product-detail", {
        title: product.title,
        product: product,
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.getCart = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    req.redirect("/");
  }

  const products = user.cart.items;
  if (products.length === 0 || !products) {
    res.redirect("/");
  }

  const asyncRes = await Promise.all(
    products.map(async (productId) => {
      let theProductId = await String(productId.productId);
      let theProductQuantity = await Number(productId.quantity);

      let product = await Product.findById(theProductId);

      let newProduct = { product, quantity: theProductQuantity };

      return newProduct;
    })
  );

  let totalCost = 0;
  for (let i = 0; i < asyncRes.length; i++) {
    totalCost += asyncRes[i].product.price * asyncRes[i].quantity;
  }

  res.render("cart", {
    title: "Cart",
    products: asyncRes,
    totalCost: totalCost,
  });
};

exports.postCart = (req, res, next) => {
  let prodId = req.params.productId;

  if (!prodId) {
    res.redirect("/");
  }

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
    });
};

exports.getRemoveFromCart = (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  if (!req.user) {
    req.redirect("/");
  }

  User.findById(userId)
    .then((user) => {
      let cart = user.cart.items; //an array

      let newCart = [];
      if (req.query.removeAll) {
        newCart = [];
      } else {
        newCart = cart.filter((product) => {
          return String(product.productId) !== String(productId);
        });
      }

      user.cart.items = newCart;
      user.save();
      res.redirect("/cart");
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });

      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user,
        },
        products: products,
      });
      order.save();
    })
    .then(() => {
      req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    });
};

exports.getOrders = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  }
  Order.find({ "user.userId": req.user._id }).then((orders) => {
    if (!orders) {
      res.redirect("/");
    }

    res.render("orders", {
      path: "/orders",
      title: "All Orders",
      orders: orders,
    });
  });
};

exports.clearOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .deleteMany()
    .then(() => {
      res.redirect("/");
    });
};
