const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/errorController");

const MONGODB_URL =
  "mongodb+srv://ryanmwakio:ngs%40ngo1620@cluster0.temth.mongodb.net/eshop?retryWrites=true&w=majority";
const devUrl = "mongodb://127.0.0.1:27017/eshop";

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

const store = new MongoDbStore({
  uri: devUrl,
  collection: "sessions",
});
const csrfProtection = csrf();

//multer filters and config
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    let fileUniqueName = uuidv4();
    let extensionArray = file.originalname.split(".");
    let extension = extensionArray[extensionArray.length - 1];

    cb(null, fileUniqueName + "." + extension);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//multer filters and config end

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(
  session({
    secret: "my secret",
    resave: true,
    saveUninitialized: true,
    store: store,
  })
);

app.use(csrfProtection);

app.use((req, res, next) => {
  req.user = req.session.user;

  next();
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.username = req.user ? req.user.name : undefined;
  res.locals.csrfToken = req.csrfToken();
  res.locals.role = req.user ? req.user.role : 2;
  next();
});

app.use(flash());

app.use(authRoutes);
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use("/500", errorController.error500);

app.all("*", (req, res, next) => {
  let isLoggedIn = req.get("Cookie") ? req.get("Cookie").split("=")[1] : false;
  isLoggedIn = Boolean(isLoggedIn);

  res.render("404", {
    title: "sorry page not found",
    path: null,
    isAuthenticated: isLoggedIn,
  });
});

app.use((error, req, res, next) => {
  res.redirect("/500");
});

mongoose
  .connect(devUrl)
  .then((result) => {
    console.log("connected");

    app.listen(8080, () => {
      console.log("server running at http://127.0.0.1:8080");
    });
  })
  .catch((err) => {
    console.error(err);
    res.redirect("/500");
  });
