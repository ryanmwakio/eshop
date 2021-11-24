const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);

const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");
const authRoutes = require("./routes/auth");
const User = require("./models/User");

const MONGODB_URL =
  "mongodb+srv://ryanmwakio:ngs%40ngo1620@cluster0.temth.mongodb.net/eshop?retryWrites=true&w=majority";

const app = express();
const store = new MongoDbStore({
  uri: MONGODB_URL,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  // User.findById("619690b0d7c3a7719083f125")
  //   // User.findById("6198aae30f2494c1deb3f4ff")
  //   .then((result) => {
  //     if (!result) {
  //       const user = new User({
  //         name: "Ryan",
  //         email: "email@test.com",
  //         cart: {
  //           items: [],
  //         },
  //       });
  //       user.save().then((user) => {
  //         req.user = user;
  //         next();
  //       });
  //     }
  //     req.user = result;
  //     next();
  //   });

  req.user = req.session.user;
  // console.log(req.user);

  next();
});

app.use(authRoutes);
app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.all("*", (req, res, next) => {
  let isLoggedIn = req.get("Cookie") ? req.get("Cookie").split("=")[1] : false;
  isLoggedIn = Boolean(isLoggedIn);

  res.render("404", {
    title: "sorry page not found",
    path: null,
    isAuthenticated: isLoggedIn,
  });
});

const devUrl = "mongodb://127.0.0.1:27017/eshop";

mongoose
  .connect(MONGODB_URL)
  .then((result) => {
    console.log("connected");

    app.listen(8080, () => {
      console.log("server running at http://127.0.0.1:8080");
    });
  })
  .catch((err) => {
    console.error(err);
  });
