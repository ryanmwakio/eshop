const { unlink } = require("fs");
const path = require("path");

const moment = require("moment");

const Product = require("../models/Product");
const serverError = require("../middleware/server-error");
const rootDir = require("../util/path");

exports.getAddProduct = (req, res, next) => {
  let message = req.flash("message");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("add-product", {
    title: "Add Product",
    path: "/admin/add-product",
    message: message,
    oldInput: { title: "", price: "", description: "" },
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!title || !image || !price || !description) {
    req.flash(
      "message",
      "ensure you have valid values for all fields and a correct image is selected."
    );

    res.render("add-product", {
      title: "Add Product",
      path: "/admin/add-product",
      message:
        "ensure you have valid values for all fields and a correct image is selected.",
      oldInput: { title: title, price: price, description: description },
    });
  } else {
    // const imageUrl = image.path;
    const imageUrl = image.filename;

    const product = new Product({
      title: title,
      imageUrl: imageUrl,
      price: price,
      description: description,
      userId: req.user,
    });

    product
      .save()
      .then((result) => {
        res.redirect("/");
      })
      .catch((err) => {
        serverError(err, next);
      });
  }
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    res.redirect("/");
  }

  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        res.redirect("/");
      }

      res.render("edit-product", {
        title: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        moment: moment,
      });
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.params.productId;
  if (!prodId) {
    res.redirect("/");
  }

  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      if (image) {
        // const filePath = path.join(rootDir, "images", product.imageUrl);
        // unlink(filePath, (err) => {
        //   if (err) throw err;
        // });

        product.imageUrl = image.filename;
      }
      product.price = updatedPrice;
      product.description = updatedDescription;
      return product.save();
    })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  if (!prodId) {
    res.redirect("/");
  }

  Product.findById(prodId)
    .then((product) => {
      const filePath = path.join(rootDir, "images", product.imageUrl);

      unlink(filePath, (err) => {
        if (err) throw err;
      });
    })
    .then(() => {
      Product.findByIdAndRemove(prodId)
        .then((result) => {
          res.redirect("/");
        })
        .catch((err) => {
          serverError(err, next);
        });
    })
    .catch((err) => {
      serverError(err, next);
    });
};
