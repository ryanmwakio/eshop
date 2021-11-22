const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");
const User = require("./models/User");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findById("619690b0d7c3a7719083f125")
    // User.findById("6198aae30f2494c1deb3f4ff")
    .then((result) => {
      if (!result) {
        const user = new User({
          name: "Ryan",
          email: "email@test.com",
          cart: {
            items: [],
          },
        });
        user.save().then((user) => {
          req.user = user;
          next();
        });
      }
      req.user = result;
      next();
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
  // console.log(req.user);
  next();
});

app.use("/name",(req,res,next)=>{
    res.send("hello Ryan");
    next();
})

app.all("*", (req, res, next) => {
  res.render("404", { title: "sorry page not found", path: null });
});

const devUrl = "mongodb://127.0.0.1:27017/eshop";
const prodUrl =
  "mongodb+srv://ryanmwakio:ngs%40ngo1620@cluster0.temth.mongodb.net/eshop?retryWrites=true&w=majority";

mongoose
  .connect(prodUrl)
  .then((result) => {
    console.log("connected");

    app.listen(8082, () => {
      console.log("server running at http://127.0.0.1:8082");
    });
  })
  .catch((err) => {
    console.error(err);
  });
