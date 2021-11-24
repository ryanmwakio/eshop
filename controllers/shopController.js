const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");

exports.getAllProducts = (req, res, next) => {
  Product.find()
    .populate("userId")
    .then((results) => {
      res.render("shop", {
        title: "E-SHOP",
        products: results,
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
      });
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
        isAuthenticated: req.session.isLoggedIn,
        path: "/get-product",
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.getCart = async (req, res, next) => {
  if (req.session.isLoggedIn) {
    const user = req.user;

    if (!user) {
      res.redirect("/");
    } else {
      User.findById(req.user._id).then(async (user) => {
        const products = user.cart.items;

        if (products.length === 0 || !products) {
          res.redirect("/");
        } else {
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
            isAuthenticated: req.session.isLoggedIn,
            path: "/cart",
          });
        }
      });
    }
  }
};

exports.postCart = (req, res, next) => {
  if (req.session.isLoggedIn) {
    let prodId = req.params.productId;

    if (!prodId) {
      res.redirect("/");
    } else {
      Product.findById(prodId)
        .then((product) => {
          User.findById(req.session.user._id).then((user) => {
            user.addToCart(product);
            res.redirect("/cart");
          });
        })
        .catch((err) => {
          console.error(err);
          res.redirect("/");
        });
    }
  }
};

exports.getRemoveFromCart = (req, res, next) => {
  if (req.session.isLoggedIn) {
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
  }
};

exports.postOrder = (req, res, next) => {
  if (req.session.isLoggedIn) {
    User.findById(req.user._id)
      .then((user) => {
        const products = user.cart.items.map(async (item) => {
          const product = await Product.findById(item.productId);

          return {
            quantity: item.quantity,
            product: product,
          };
        });

        const order = new Order({
          user: {
            name: req.user.name,
            userId: req.user,
          },
          products: products,
        });

        order
          .save()
          .then(() => {
            user.clearCart();
          })
          .then(() => {
            res.redirect("/orders");
          });
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

exports.getOrders = (req, res, next) => {
  if (req.session.isLoggedIn) {
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
        isAuthenticated: req.session.isLoggedIn,
      });
    });
  }
};

exports.clearOrders = (req, res, next) => {
  if (req.session.isLoggedIn) {
    Order.find({ "user.userId": req.user._id })
      .deleteMany()
      .then(() => {
        res.redirect("/");
      });
  }
};
