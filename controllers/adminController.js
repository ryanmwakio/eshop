const moment = require("moment");

const Product = require("../models/Product");

exports.getAddProduct = (req, res, next) => {
  res.render("add-product", {
    title: "Add Product",
    path: "/admin/add-product",
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  if (!title || !imageUrl || !price || !description) {
    res.redirect("/");
  }

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
      console.error(err);
      res.redirect("/500");
    });
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
      console.error(err);
      res.redirect("/500");
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.params.productId;
  if (!prodId) {
    res.redirect("/");
  }

  const updatedTitle = req.body.title;
  const updatedImgUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.imageUrl = updatedImgUrl;
      product.price = updatedPrice;
      product.description = updatedDescription;
      return product.save();
    })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/500");
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  if (!prodId) {
    res.redirect("/");
  }

  Product.findByIdAndRemove(prodId)
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/500");
    });
};
