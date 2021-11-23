exports.getLogin = (req, res, next) => {
  let isLoggedIn = req.get("Cookie") ? req.get("Cookie").split("=")[1] : false;
  isLoggedIn = Boolean(isLoggedIn);

  res.render("auth/login", {
    path: "/login",
    title: "Login",
    isAuthenticated: isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  //   let email = req.body.email;
  //   let password = req.body.password;

  res.setHeader("Set-Cookie", "loggedIn=true; Max-Age=10");

  res.redirect("/");
};
