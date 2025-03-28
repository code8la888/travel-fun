if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");
const secret = process.env.SECRET;

const userRoutes = require("./routes/users");
const hotelRoutes = require("./routes/hotels");
const reviewsRoutes = require("./routes/reviews");
const mongoSanitize = require("express-mongo-sanitize");
// const mongourl = process.env.DB_URL || "mongodb://localhost:27017/hotel";
// const mongourl = "mongodb://localhost:27017/hotel";
const mongourl =
  "mongodb+srv://kazuhaha1997:CioT8ihUvqVEqpHo@cluster0.doghf.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const MongoStore = require("connect-mongo");
mongoose.connect(mongourl);

mongoose.connection.on(
  "error",
  console.error.bind(console, "connection error:")
);
mongoose.connection.once("open", () => {
  console.log("connected to database");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

const store = MongoStore.create({
  mongoUrl: mongourl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});

store.on("error", function (e) {
  console.log("session store error", e);
});

const sessionConfig = {
  store,
  name: "session", //更改預設名稱
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, //確保只有http請求可以訪問cookie，防止惡意的js腳本存取cookie
    // secure: true, //只有在https連接下才可以訪問cookie,不支援localhost
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/", // add this
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/",
];
const connectSrcUrls = ["https://api.maptiler.com/"];

const fontSrcUrls = ["https://cdn.jsdelivr.net", "https://fonts.gstatic.com"];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/ddmaqiu3h/",
        "https://images.unsplash.com/",
        "https://api.maptiler.com/",
        "https://taiwan.taiwanstay.net.tw",
        "https://fastly.picsum.photos", // 真正顯示圖片的來源
        "https://picsum.photos", // 用來產生圖片的主站
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);
app.get("/fakeUser", async (req, res) => {
  const user = new User({ email: "pig@gmail.com", username: "pinkpig" });
  const newUser = await User.register(user, "123");
  res.send(newUser);
});

app.use("/hotels", hotelRoutes);
app.use("/hotels/:id/reviews", reviewsRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "出了一點問題!";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("listen on port 3000");
});
