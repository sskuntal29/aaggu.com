import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import db from "../db/sqlite.js";

const router = express.Router();

export function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Use env var if set, otherwise build from request dynamically
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        proxy: true, // ✅ Trust Render's reverse proxy (fixes https detection)
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await db.upsertUser({
            google_id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value || null,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

// Google OAuth routes
router.get(
  "/google",
  (req, res, next) => {
    if (req.query.redirect) req.session.authRedirect = req.query.redirect;
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/?loginfailed=1" }),
  (req, res) => {
    const redirect = req.session.authRedirect || "/";
    delete req.session.authRedirect;
    res.redirect(redirect);
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

router.get("/me", async (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });
  const subscription = await db.getActiveSubscription(req.user.id);
  res.json({
    loggedIn: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      gender: req.user.gender,
    },
    isPremium: !!subscription,
    subscription: subscription || null,
  });
});

router.post("/set-gender", express.json(), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  const { gender } = req.body;
  if (!["male", "female", "other"].includes(gender))
    return res.status(400).json({ error: "Invalid gender" });
  await db.updateUserGender(req.user.id, gender);
  req.user.gender = gender;
  res.json({ success: true });
});

export { passport };
export default router;
