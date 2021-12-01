const path = require("path");
const fs = require("fs");
const moment = require("moment");

const pdfKit = require("pdfkit");

const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const serverError = require("../middleware/server-error");
const rootDir = require("../util/path");

const ITEMS_PER_PAGE = 8;

exports.getAllProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((results) => {
      res.render("shop", {
        title: "E-SHOP",
        products: results,
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      res.render("product-detail", {
        title: product.title,
        product: product,
        path: "/get-product",
      });
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.getCart = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    res.redirect("/");
  } else {
    User.findById(req.user._id).then(async (user) => {
      try {
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
            path: "/cart",
          });
        }
      } catch (err) {
        serverError(err, next);
      }
    });
  }
};

exports.postCart = (req, res, next) => {
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
        serverError(err, next);
      });
  }
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
      serverError(err, next);
    });
};

exports.postOrder = (req, res, next) => {
  User.findById(req.user._id)
    .then(async (user) => {
      const asyncRes = await Promise.all(
        user.cart.items.map(async (item) => {
          const product = await Product.findById(item.productId);

          return {
            quantity: item.quantity,
            product: product,
          };
        })
      );

      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user,
        },
        products: asyncRes,
      });

      order
        .save()
        .then(() => {
          user.clearCart();
        })
        .then(() => {
          res.redirect("/orders");
        })
        .catch((err) => {
          serverError(err, next);
        });
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.getOrders = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  }
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      if (!orders) {
        res.redirect("/");
      }

      res.render("orders", {
        path: "/orders",
        title: "All Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.clearOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .deleteMany()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        res.redirect("/orders");
      } else {
        if (String(order.user.userId) !== String(req.user._id)) {
          res.redirect("/orders");
        } else {
          const invoiceName = "invoice-" + orderId + ".pdf";
          const invoicePath = path.join(
            rootDir,
            "data",
            "invoices",
            invoiceName
          );

          //Header
          let companyLogo = path.join(rootDir, "public", "images", "logo.png");
          let fileName = invoicePath;
          let fontNormal = "Helvetica";
          let fontBold = "Helvetica-Bold";

          let sellerInfo = {
            companyName: "E-shop.",
            address: "Nairobi, Kenya",
            city: "Nairobi",
            pincode: "00100",
            country: "Kenya",
            contactNo: "+254 712345678",
          };

          let customerInfo = {
            customerName: req.user.name,
            address: "Ronald Ngala",
            city: "Nairobi",
            pincode: "00100",
            country: "Kenya",
          };

          let orderInfo = {
            orderNo: order._id,
            invoiceNo: "invoice-" + orderId,
            invoiceDate: moment(
              new Date().getTime(),
              "mmmm do yyyy, h:mm:ss a"
            ),

            products: order.products,
            totalValue: 45997,
          };

          function createPdf() {
            try {
              let pdfDoc = new pdfKit({ size: "A4", margin: 50 });

              res.setHeader("Content-Type", "application/pdf");
              res.setHeader(
                "Content-Disposition",
                "attachment;filename=" + invoiceName
              );
              let stream = fs.createWriteStream(fileName);

              pdfDoc.pipe(stream);

              pdfDoc.image(companyLogo, 25, 20, { width: 50, height: 50 });
              pdfDoc.font(fontBold).text("E-Shop.", 20, 75);
              pdfDoc
                .font(fontNormal)
                .fontSize(14)
                .text("Order Invoice/Bill Receipt", 400, 30, { width: 200 });
              pdfDoc
                .fontSize(10)
                .text(moment(new Date(), "mmmm do yyyy, h:mm:ss a"), 400, 46, {
                  width: 200,
                });

              pdfDoc.font(fontBold).text("Sold by:", 20, 100);
              pdfDoc
                .font(fontNormal)
                .text(sellerInfo.companyName, 20, 115, { width: 250 });
              pdfDoc.text(sellerInfo.address, 20, 130, { width: 250 });
              pdfDoc.text(sellerInfo.city + " " + sellerInfo.pincode, 20, 145, {
                width: 250,
              });

              pdfDoc.font(fontBold).text("Customer details:", 400, 100);
              pdfDoc
                .font(fontNormal)
                .text(customerInfo.customerName, 397, 115, { width: 250 });
              pdfDoc.text(req.user.email, 400, 130, { width: 250 });
              pdfDoc.text(
                customerInfo.city + " " + customerInfo.pincode,
                400,
                145,
                { width: 250 }
              );
              pdfDoc.text(customerInfo.country, 400, 160, { width: 250 });

              pdfDoc.text("Order No: " + orderInfo.orderNo, 20, 195, {
                width: 250,
              });
              pdfDoc.text("Invoice No: " + orderInfo.invoiceNo, 20, 210, {
                width: 250,
              });
              pdfDoc.text(
                "Time: " + moment(new Date()).format("h:mm:ss a"),
                20,
                225,
                {
                  width: 250,
                }
              );

              pdfDoc.rect(20, 250, 560, 20).fill("#6D28D9").stroke("#6D28D9");
              pdfDoc.fillColor("#fff").text("ID", 20, 256, { width: 90 });
              pdfDoc.text("Product", 110, 256, { width: 190 });
              pdfDoc.text("Qty", 300, 256, { width: 100 });
              pdfDoc.text("Price", 400, 256, { width: 100 });
              pdfDoc.text("Total Price", 500, 256, { width: 100 });

              let productNo = 1;
              let totalCost = 0;
              orderInfo.products.forEach((element) => {
                let y = 256 + productNo * 20;
                pdfDoc.fillColor("#000").text(productNo, 20, y, { width: 90 });
                pdfDoc.text(element.product.title, 110, y, { width: 190 });
                pdfDoc.text(element.quantity, 300, y, { width: 100 });
                pdfDoc.text(element.product.price, 400, y, { width: 100 });
                pdfDoc.text(element.product.price * element.quantity, 500, y, {
                  width: 100,
                });
                productNo++;
                totalCost =
                  totalCost + element.quantity * element.product.price;
              });

              pdfDoc
                .rect(20, 256 + productNo * 20, 560, 0.2)
                .fillColor("#000")
                .stroke("#000");
              productNo++;

              pdfDoc
                .font(fontBold)
                .text(
                  "Total:",
                  400,
                  productNo > 3 ? 276 + productNo * 17 : 256 + productNo * 17
                );
              pdfDoc
                .font(fontBold)
                .text(
                  "Kshs " + totalCost,
                  500,
                  productNo > 3 ? 276 + productNo * 17 : 256 + productNo * 17,
                  { width: 500 }
                );
              pdfDoc.text(
                "*******Developed by: ryanmwakio6@gmail.com******",
                150,
                700
              );

              pdfDoc.pipe(res);
              pdfDoc.end();
            } catch (error) {
              console.log("Error occurred", error);
            }
          }

          createPdf();
          // fs.readFile(invoicePath, (err, data) => {
          //   if (err) {
          //     serverError(err, next);
          //   } else {
          //     res.setHeader("Content-Type", "application/pdf");
          //     res.setHeader(
          //       "Content-Disposition",
          //       "attachment;filename=" + invoiceName
          //     );
          //     res.send(data);
          //   }
          // });

          // const file = fs.createReadStream(invoicePath);
          // res.setHeader("Content-Type", "application/pdf");
          // res.setHeader(
          //   "Content-Disposition",
          //   "attachment;filename=" + invoiceName
          // );
          // file.pipe(res);
        }
      }
    })
    .catch((err) => {
      serverError(err, next);
    });
};

//stk MPESA
exports.getStk = (req, res, next) => {
  let endpoint = "";
  let auth = "Bearer " + req.access_token;

  let date = new Date();
  const timestamp =
    date.getFullYear() +
    "" +
    "" +
    date.getMonth() +
    "" +
    "" +
    date.getDate() +
    "" +
    "" +
    date.getHours() +
    "" +
    "" +
    date.getMinutes() +
    "" +
    "" +
    date.getSeconds();
  const password = new Buffer.from(
    "174379" +
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
      timestamp
  ).toString("base64");

  request(
    {
      url: endpoint,
      method: "POST",
      headers: {
        Authorization: auth,
      },
      json: {
        ShortCode: "600383",
        BusinessShortCode: "174379",
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: "1",
        PartyA: "254716437799",
        PartyB: "174379",
        PhoneNumber: "254716437799",
        CallBackURL: "http://197.248.86.122:801/stk_callback",
        AccountReference: "Test",
        TransactionDesc: "TestPay",
      },
    },
    function (error, response, body) {
      if (error) {
        console.error(error);
      }
      console.log(body);
      res.status(200).json(body);
    }
  );
};
