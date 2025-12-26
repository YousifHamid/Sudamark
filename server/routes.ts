import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { db } from "./db";
import { users, cars, serviceProviders, favorites, sliderImages, admins, otpCodes, magicTokens, buyerOffers, inspectionRequests, payments, appSettings, couponCodes, couponUsages } from "@shared/schema";
import crypto from "crypto";
import { eq, desc, and, gt, like, or, sql } from "drizzle-orm";

const emailTransporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

async function sendMagicLinkEmail(email: string, token: string, magicLink: string): Promise<boolean> {
  if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
    console.log(`[MAGIC LINK] Demo mode - no SMTP credentials. Token: ${token}`);
    return false;
  }
  
  try {
    await emailTransporter.sendMail({
      from: `"Arabaty" <${process.env.BREVO_SMTP_LOGIN}>`,
      to: email,
      subject: "رابط تسجيل الدخول - Arabaty Login Link",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">عربتي - Arabaty</h1>
          <p style="font-size: 16px; text-align: center;">مرحباً! استخدم الرابط أدناه لتسجيل الدخول:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px;">
              تسجيل الدخول
            </a>
          </div>
          <p style="text-align: center; color: #666;">أو أدخل الرمز التالي في التطبيق:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <code style="font-size: 14px; word-break: break-all;">${token}</code>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px;">هذا الرابط صالح لمدة 30 دقيقة فقط</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; color: #999; font-size: 12px;">
            Hello! Use the link above to login to Arabaty.<br>
            This link expires in 30 minutes.
          </p>
        </div>
      `,
    });
    console.log(`[MAGIC LINK] Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`[MAGIC LINK] Failed to send email:`, error);
    return false;
  }
}

const JWT_SECRET_RAW = process.env.SESSION_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error("FATAL: SESSION_SECRET environment variable is required for JWT authentication");
}
const JWT_SECRET: string = JWT_SECRET_RAW;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const MAGIC_LINK_EXPIRY_MINUTES = 30;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

interface AuthRequest extends Request {
  user?: { id: string; phone: string; roles: string[] };
  admin?: { id: string; email: string; role: string };
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required" });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; phone: string; roles: string[] };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin authorization required" });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; isAdmin: boolean };
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid admin token" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/auth/send-magic-link", async (req: Request, res: Response) => {
    try {
      const { email, phone, countryCode } = req.body;
      
      if (!email || !phone) {
        return res.status(400).json({ error: "Email and phone number are required" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      const fullPhone = `${countryCode || "+249"}${phone.replace(/\s/g, "")}`;
      
      const combinedRateKey = `magic:${email}:${fullPhone}`;
      if (!rateLimit(combinedRateKey)) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
      
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
      
      await db.delete(magicTokens).where(and(
        eq(magicTokens.email, email),
        eq(magicTokens.phone, fullPhone),
        eq(magicTokens.used, false)
      ));
      
      await db.insert(magicTokens).values({
        email,
        phone: fullPhone,
        token,
        expiresAt,
        used: false,
      });
      
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN 
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "http://localhost:5000";
      const magicLink = `${baseUrl}/api/auth/verify-magic-link?token=${token}`;
      
      const emailSent = await sendMagicLinkEmail(email, token, magicLink);
      
      if (emailSent) {
        console.log(`[MAGIC LINK] Email sent to ${email}`);
        res.json({ 
          success: true, 
          message: "Magic link sent to email"
        });
      } else {
        console.log(`[MAGIC LINK] Demo mode - Token: ${token}`);
        res.json({ 
          success: true, 
          message: "Magic link sent to email",
          demoToken: token
        });
      }
    } catch (error) {
      console.error("Send magic link error:", error);
      res.status(500).json({ error: "Failed to send magic link" });
    }
  });

  app.get("/api/auth/verify-magic-link", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }
      
      const [tokenRecord] = await db.select().from(magicTokens)
        .where(and(
          eq(magicTokens.token, token),
          eq(magicTokens.used, false),
          gt(magicTokens.expiresAt, new Date())
        ))
        .limit(1);
      
      if (!tokenRecord) {
        return res.status(400).json({ error: "Invalid or expired magic link" });
      }
      
      await db.update(magicTokens)
        .set({ used: true })
        .where(eq(magicTokens.id, tokenRecord.id));
      
      let [existingUser] = await db.select().from(users)
        .where(eq(users.email, tokenRecord.email))
        .limit(1);
      
      if (!existingUser) {
        [existingUser] = await db.select().from(users)
          .where(eq(users.phone, tokenRecord.phone))
          .limit(1);
          
        if (existingUser) {
          await db.update(users)
            .set({ email: tokenRecord.email, emailVerified: true })
            .where(eq(users.id, existingUser.id));
          existingUser.email = tokenRecord.email;
          existingUser.emailVerified = true;
        }
      }
      
      if (existingUser) {
        if (!existingUser.emailVerified) {
          await db.update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtToken = jwt.sign(
          { id: existingUser.id, phone: existingUser.phone, roles: existingUser.roles },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        
        const appDeepLink = `arabaty://auth/callback?token=${jwtToken}&isNewUser=false`;
        return res.redirect(appDeepLink);
      }
      
      const tempToken = jwt.sign(
        { email: tokenRecord.email, phone: tokenRecord.phone, type: "registration" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      
      const appDeepLink = `arabaty://auth/callback?tempToken=${tempToken}&isNewUser=true&email=${encodeURIComponent(tokenRecord.email)}&phone=${encodeURIComponent(tokenRecord.phone)}`;
      return res.redirect(appDeepLink);
    } catch (error) {
      console.error("Verify magic link error:", error);
      res.status(500).json({ error: "Failed to verify magic link" });
    }
  });

  app.post("/api/auth/verify-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      
      const [tokenRecord] = await db.select().from(magicTokens)
        .where(and(
          eq(magicTokens.token, token),
          eq(magicTokens.used, false),
          gt(magicTokens.expiresAt, new Date())
        ))
        .limit(1);
      
      if (!tokenRecord) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      await db.update(magicTokens)
        .set({ used: true })
        .where(eq(magicTokens.id, tokenRecord.id));
      
      let [existingUser] = await db.select().from(users)
        .where(eq(users.email, tokenRecord.email))
        .limit(1);
      
      if (!existingUser) {
        [existingUser] = await db.select().from(users)
          .where(eq(users.phone, tokenRecord.phone))
          .limit(1);
          
        if (existingUser) {
          await db.update(users)
            .set({ email: tokenRecord.email, emailVerified: true })
            .where(eq(users.id, existingUser.id));
        }
      }
      
      if (existingUser) {
        if (!existingUser.emailVerified) {
          await db.update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtToken = jwt.sign(
          { id: existingUser.id, phone: existingUser.phone, roles: existingUser.roles },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        
        return res.json({ user: existingUser, token: jwtToken, isNewUser: false });
      }
      
      res.json({ 
        isNewUser: true, 
        email: tokenRecord.email, 
        phone: tokenRecord.phone 
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ error: "Failed to verify token" });
    }
  });

  app.post("/api/auth/phone-login", async (req: Request, res: Response) => {
    try {
      const { phone, countryCode } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      const [existingUser] = await db.select().from(users)
        .where(eq(users.phone, phone))
        .limit(1);
      
      if (existingUser) {
        const token = jwt.sign(
          { id: existingUser.id, phone: existingUser.phone, roles: existingUser.roles },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({ user: existingUser, token, isNewUser: false });
      }
      
      res.json({ isNewUser: true, phone });
    } catch (error) {
      console.error("Phone login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phone, countryCode } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      const fullPhone = `${countryCode || "+249"}${phone}`;
      
      if (!rateLimit(`otp:${fullPhone}`)) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
      const isDemoMode = process.env.NODE_ENV !== "production" || process.env.OTP_DEMO_MODE === "true";
      
      let otpCode: string;
      if (isDemoMode) {
        otpCode = "123456";
      } else {
        otpCode = generateOTP();
      }
      
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      
      await db.delete(otpCodes).where(eq(otpCodes.phone, fullPhone));
      await db.insert(otpCodes).values({
        phone: fullPhone,
        code: otpCode,
        expiresAt,
        verified: false,
        attempts: 0,
      });
      
      if (!isDemoMode && process.env.TWILIO_ACCOUNT_SID) {
        console.log(`[OTP] Would send ${otpCode} to ${fullPhone} via Twilio`);
      }
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp, countryCode } = req.body;
      const fullPhone = `${countryCode || "+249"}${phone}`;
      
      if (!rateLimit(`verify:${fullPhone}`)) {
        return res.status(429).json({ error: "Too many attempts. Please try again later." });
      }
      
      const [otpRecord] = await db.select().from(otpCodes)
        .where(and(
          eq(otpCodes.phone, fullPhone),
          eq(otpCodes.verified, false),
          gt(otpCodes.expiresAt, new Date())
        ))
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);
      
      if (!otpRecord) {
        return res.status(400).json({ error: "OTP expired or not found" });
      }
      
      if (otpRecord.attempts && otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(400).json({ error: "Too many attempts. Request a new OTP" });
      }
      
      if (otpRecord.code !== otp) {
        await db.update(otpCodes)
          .set({ attempts: (otpRecord.attempts || 0) + 1 })
          .where(eq(otpCodes.id, otpRecord.id));
        return res.status(400).json({ error: "Invalid OTP" });
      }
      
      await db.update(otpCodes)
        .set({ verified: true })
        .where(eq(otpCodes.id, otpRecord.id));
      
      const [existingUser] = await db.select().from(users).where(eq(users.phone, fullPhone)).limit(1);
      
      if (existingUser) {
        const token = jwt.sign(
          { id: existingUser.id, phone: existingUser.phone, roles: existingUser.roles },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({ user: existingUser, token, isNewUser: false });
      }
      
      res.json({ isNewUser: true, phone: fullPhone });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { phone, email, name, roles, countryCode, city } = req.body;
      
      const [existingUser] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      if (email) {
        const [existingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }
      
      const [newUser] = await db.insert(users).values({
        phone,
        email: email || null,
        emailVerified: !!email,
        name,
        roles: roles || ["buyer"],
        countryCode: countryCode || "+249",
        city: city || null,
      }).returning();
      
      const token = jwt.sign(
        { id: newUser.id, phone: newUser.phone, roles: newUser.roles },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      
      res.json({ user: newUser, token });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { name, roles } = req.body;
      const [updatedUser] = await db.update(users)
        .set({ name, roles, updatedAt: new Date() })
        .where(eq(users.id, req.user!.id))
        .returning();
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/cars", async (req: Request, res: Response) => {
    try {
      const { category, city, minPrice, maxPrice, search } = req.query;
      
      let conditions = [eq(cars.isActive, true)];
      
      if (category && typeof category === "string") {
        conditions.push(eq(cars.category, category));
      }
      if (city && typeof city === "string") {
        conditions.push(eq(cars.city, city));
      }
      if (minPrice && typeof minPrice === "string") {
        conditions.push(sql`${cars.price} >= ${parseInt(minPrice)}`);
      }
      if (maxPrice && typeof maxPrice === "string") {
        conditions.push(sql`${cars.price} <= ${parseInt(maxPrice)}`);
      }
      if (search && typeof search === "string") {
        conditions.push(or(
          like(cars.make, `%${search}%`),
          like(cars.model, `%${search}%`),
          like(cars.description, `%${search}%`)
        )!);
      }
      
      const allCars = await db.select().from(cars)
        .where(and(...conditions))
        .orderBy(desc(cars.createdAt));
      res.json(allCars);
    } catch (error) {
      console.error("Fetch cars error:", error);
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  app.get("/api/cars/featured", async (_req: Request, res: Response) => {
    try {
      const featuredCars = await db.select().from(cars)
        .where(and(eq(cars.isActive, true), eq(cars.isFeatured, true)))
        .orderBy(desc(cars.createdAt))
        .limit(10);
      res.json(featuredCars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured cars" });
    }
  });

  app.get("/api/cars/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [car] = await db.select().from(cars).where(eq(cars.id, id));
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      const [owner] = await db.select({
        id: users.id,
        name: users.name,
        phone: users.phone,
      }).from(users).where(eq(users.id, car.userId));
      
      res.json({ ...car, owner });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  app.post("/api/cars", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const carData = { ...req.body, userId: req.user!.id };
      const [newCar] = await db.insert(cars).values(carData).returning();
      res.json(newCar);
    } catch (error) {
      console.error("Create car error:", error);
      res.status(500).json({ error: "Failed to create car listing" });
    }
  });

  app.put("/api/cars/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const [existingCar] = await db.select().from(cars).where(eq(cars.id, id));
      
      if (!existingCar) {
        return res.status(404).json({ error: "Car not found" });
      }
      if (existingCar.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to edit this car" });
      }
      
      const [updatedCar] = await db.update(cars)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(cars.id, id))
        .returning();
      res.json(updatedCar);
    } catch (error) {
      res.status(500).json({ error: "Failed to update car" });
    }
  });

  app.delete("/api/cars/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const [existingCar] = await db.select().from(cars).where(eq(cars.id, id));
      
      if (!existingCar) {
        return res.status(404).json({ error: "Car not found" });
      }
      if (existingCar.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this car" });
      }
      
      await db.delete(cars).where(eq(cars.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete car" });
    }
  });

  app.get("/api/my-cars", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const myCars = await db.select().from(cars)
        .where(eq(cars.userId, req.user!.id))
        .orderBy(desc(cars.createdAt));
      res.json(myCars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your cars" });
    }
  });

  app.get("/api/service-providers", async (req: Request, res: Response) => {
    try {
      const { type, city } = req.query;
      let conditions: any[] = [];
      
      if (type && typeof type === "string") {
        conditions.push(eq(serviceProviders.type, type));
      }
      if (city && typeof city === "string") {
        conditions.push(eq(serviceProviders.city, city));
      }
      
      let query = conditions.length > 0
        ? db.select().from(serviceProviders).where(and(...conditions))
        : db.select().from(serviceProviders);
      
      const providers = await query.orderBy(desc(serviceProviders.rating));
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
      if (!provider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service provider" });
    }
  });

  app.get("/api/slider-images", async (_req: Request, res: Response) => {
    try {
      const images = await db.select().from(sliderImages)
        .where(eq(sliderImages.isActive, true))
        .orderBy(sliderImages.order);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slider images" });
    }
  });

  app.get("/api/favorites", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userFavorites = await db.select({
        favorite: favorites,
        car: cars,
      })
        .from(favorites)
        .leftJoin(cars, eq(favorites.carId, cars.id))
        .where(eq(favorites.userId, req.user!.id));
      res.json(userFavorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { carId } = req.body;
      
      const [existing] = await db.select().from(favorites)
        .where(and(eq(favorites.userId, req.user!.id), eq(favorites.carId, carId)));
      
      if (existing) {
        return res.status(400).json({ error: "Already in favorites" });
      }
      
      const [newFavorite] = await db.insert(favorites)
        .values({ userId: req.user!.id, carId })
        .returning();
      res.json(newFavorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:carId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { carId } = req.params;
      await db.delete(favorites)
        .where(and(eq(favorites.userId, req.user!.id), eq(favorites.carId, carId)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!rateLimit(`admin:${email}`)) {
        return res.status(429).json({ error: "Too many login attempts. Please try again later." });
      }
      
      const [admin] = await db.select().from(admins)
        .where(and(eq(admins.email, email), eq(admins.isActive, true)));
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role, isAdmin: true },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({ admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }, token });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/admin/stats", adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [carsCount] = await db.select({ count: sql<number>`count(*)` }).from(cars);
      const [activeCarsCount] = await db.select({ count: sql<number>`count(*)` }).from(cars).where(eq(cars.isActive, true));
      const [providersCount] = await db.select({ count: sql<number>`count(*)` }).from(serviceProviders);
      
      res.json({
        totalUsers: Number(usersCount.count),
        totalCars: Number(carsCount.count),
        activeCars: Number(activeCarsCount.count),
        totalProviders: Number(providersCount.count),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/cars", adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const allCars = await db.select({
        car: cars,
        owner: {
          id: users.id,
          name: users.name,
          phone: users.phone,
        },
      })
        .from(cars)
        .leftJoin(users, eq(cars.userId, users.id))
        .orderBy(desc(cars.createdAt));
      res.json(allCars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  app.post("/api/admin/cars", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { make, model, year, price, mileage, city, transmission, fuelType, description, userId } = req.body;
      
      let ownerId = userId;
      if (!ownerId) {
        const [adminUser] = await db.select().from(users).where(eq(users.name, "Admin")).limit(1);
        if (adminUser) {
          ownerId = adminUser.id;
        } else {
          const [newAdmin] = await db.insert(users).values({
            name: "Admin",
            phone: "0000000000",
            roles: ["admin"],
          }).returning();
          ownerId = newAdmin.id;
        }
      }
      
      const [newCar] = await db.insert(cars).values({
        userId: ownerId,
        make,
        model,
        year,
        price,
        mileage: mileage || 0,
        city,
        transmission,
        fuelType,
        description,
        isActive: true,
        isFeatured: false,
        images: [],
      }).returning();
      res.json(newCar);
    } catch (error) {
      console.error("Failed to create car:", error);
      res.status(500).json({ error: "Failed to create car" });
    }
  });

  app.put("/api/admin/cars/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive, isFeatured, make, model, year, price, mileage, city, transmission, fuelType, description } = req.body;
      
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (make) updateData.make = make;
      if (model) updateData.model = model;
      if (year) updateData.year = year;
      if (price) updateData.price = price;
      if (mileage !== undefined) updateData.mileage = mileage;
      if (city) updateData.city = city;
      if (transmission) updateData.transmission = transmission;
      if (fuelType) updateData.fuelType = fuelType;
      if (description !== undefined) updateData.description = description;
      
      const [updatedCar] = await db.update(cars)
        .set(updateData)
        .where(eq(cars.id, id))
        .returning();
      res.json(updatedCar);
    } catch (error) {
      res.status(500).json({ error: "Failed to update car" });
    }
  });

  app.delete("/api/admin/cars/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(cars).where(eq(cars.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete car" });
    }
  });

  app.get("/api/admin/service-providers", adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const providers = await db.select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt));
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service providers" });
    }
  });

  app.post("/api/admin/service-providers", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const [newProvider] = await db.insert(serviceProviders).values(req.body).returning();
      res.json(newProvider);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service provider" });
    }
  });

  app.put("/api/admin/service-providers/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const [updatedProvider] = await db.update(serviceProviders)
        .set(req.body)
        .where(eq(serviceProviders.id, id))
        .returning();
      res.json(updatedProvider);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service provider" });
    }
  });

  app.delete("/api/admin/service-providers/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service provider" });
    }
  });

  app.get("/api/admin/slider-images", adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const images = await db.select().from(sliderImages).orderBy(sliderImages.order);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slider images" });
    }
  });

  app.post("/api/admin/slider-images", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const [newImage] = await db.insert(sliderImages).values(req.body).returning();
      res.json(newImage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create slider image" });
    }
  });

  app.delete("/api/admin/slider-images/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(sliderImages).where(eq(sliderImages.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete slider image" });
    }
  });

  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    try {
      const [existingAdmin] = await db.select().from(admins).limit(1);
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin already exists" });
      }
      
      const { email, password, name } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);
      
      const [newAdmin] = await db.insert(admins).values({
        email,
        passwordHash,
        name,
        role: "superadmin",
        isActive: true,
      }).returning();
      
      const token = jwt.sign(
        { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role, isAdmin: true },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({ admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name }, token });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  // Buyer Offers API
  app.post("/api/offers", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { carId, offerPrice, message } = req.body;
      const buyerId = req.user!.id;
      
      // Get car to find seller
      const [car] = await db.select().from(cars).where(eq(cars.id, carId));
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      // Check if buyer is not the seller
      if (car.userId === buyerId) {
        return res.status(400).json({ error: "Cannot make an offer on your own car" });
      }
      
      const [newOffer] = await db.insert(buyerOffers).values({
        carId,
        buyerId,
        offerPrice,
        message,
        status: "pending",
      }).returning();
      
      res.json(newOffer);
    } catch (error) {
      console.error("Create offer error:", error);
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.get("/api/offers/my-offers", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const buyerId = req.user!.id;
      const offers = await db.select().from(buyerOffers)
        .where(eq(buyerOffers.buyerId, buyerId))
        .orderBy(desc(buyerOffers.createdAt));
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/offers/received", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      // Get all cars owned by seller
      const sellerCars = await db.select().from(cars).where(eq(cars.userId, sellerId));
      const carIds = sellerCars.map(c => c.id);
      
      if (carIds.length === 0) {
        return res.json([]);
      }
      
      // Get offers for seller's cars
      const offers = await db.select({
        offer: buyerOffers,
        car: cars,
        buyer: users,
      })
        .from(buyerOffers)
        .innerJoin(cars, eq(buyerOffers.carId, cars.id))
        .innerJoin(users, eq(buyerOffers.buyerId, users.id))
        .where(sql`${buyerOffers.carId} = ANY(${sql.raw(`ARRAY[${carIds.map(id => `'${id}'`).join(',')}]::varchar[]`)})`)
        .orderBy(desc(buyerOffers.createdAt));
      
      res.json(offers);
    } catch (error) {
      console.error("Fetch received offers error:", error);
      res.status(500).json({ error: "Failed to fetch received offers" });
    }
  });

  app.put("/api/offers/:id/status", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const sellerId = req.user!.id;
      
      // Verify the offer belongs to a car owned by the seller
      const [offer] = await db.select().from(buyerOffers).where(eq(buyerOffers.id, id));
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      
      const [car] = await db.select().from(cars).where(eq(cars.id, offer.carId));
      if (!car || car.userId !== sellerId) {
        return res.status(403).json({ error: "Not authorized to update this offer" });
      }
      
      const [updatedOffer] = await db.update(buyerOffers)
        .set({ status })
        .where(eq(buyerOffers.id, id))
        .returning();
      
      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update offer status" });
    }
  });

  // Inspection Requests API
  app.post("/api/inspection-requests", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { carId, message } = req.body;
      const buyerId = req.user!.id;
      
      // Get car to find seller
      const [car] = await db.select().from(cars).where(eq(cars.id, carId));
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      const [newRequest] = await db.insert(inspectionRequests).values({
        carId,
        buyerId,
        sellerId: car.userId,
        message,
        status: "pending",
      }).returning();
      
      res.json(newRequest);
    } catch (error) {
      console.error("Create inspection request error:", error);
      res.status(500).json({ error: "Failed to create inspection request" });
    }
  });

  app.get("/api/inspection-requests/received", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const requests = await db.select({
        request: inspectionRequests,
        car: cars,
        buyer: users,
      })
        .from(inspectionRequests)
        .innerJoin(cars, eq(inspectionRequests.carId, cars.id))
        .innerJoin(users, eq(inspectionRequests.buyerId, users.id))
        .where(eq(inspectionRequests.sellerId, sellerId))
        .orderBy(desc(inspectionRequests.createdAt));
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inspection requests" });
    }
  });

  app.put("/api/inspection-requests/:id/respond", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, sellerResponse } = req.body;
      const sellerId = req.user!.id;
      
      const [request] = await db.select().from(inspectionRequests).where(eq(inspectionRequests.id, id));
      if (!request || request.sellerId !== sellerId) {
        return res.status(403).json({ error: "Not authorized to respond to this request" });
      }
      
      const [updatedRequest] = await db.update(inspectionRequests)
        .set({ status, sellerResponse, updatedAt: new Date() })
        .where(eq(inspectionRequests.id, id))
        .returning();
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inspection request" });
    }
  });

  // Payment System APIs
  const FREE_LISTING_LIMIT = 1000;
  const LISTING_FEE = 10000;

  app.get("/api/listings/status", async (req: Request, res: Response) => {
    try {
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(cars);
      const totalListings = Number(result?.count || 0);
      const requiresPayment = totalListings >= FREE_LISTING_LIMIT;
      
      res.json({
        totalListings,
        freeLimit: FREE_LISTING_LIMIT,
        requiresPayment,
        listingFee: LISTING_FEE,
      });
    } catch (error) {
      console.error("Get listing status error:", error);
      res.status(500).json({ error: "Failed to get listing status" });
    }
  });

  app.post("/api/payments", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { carId, trxNo, amount, paidAt } = req.body;
      const userId = req.user!.id;
      
      if (!trxNo || !amount || !paidAt) {
        return res.status(400).json({ error: "Transaction details required" });
      }
      
      if (amount < LISTING_FEE) {
        return res.status(400).json({ error: `Minimum payment is ${LISTING_FEE} SDG` });
      }
      
      const [existingPayment] = await db.select().from(payments).where(eq(payments.trxNo, trxNo));
      if (existingPayment) {
        return res.status(400).json({ error: "Transaction ID already used" });
      }
      
      const [newPayment] = await db.insert(payments).values({
        userId,
        carId,
        trxNo,
        amount,
        paidAt,
        status: "pending",
      }).returning();
      
      const [autoApproveSetting] = await db.select().from(appSettings).where(eq(appSettings.key, "auto_approve_payments"));
      if (autoApproveSetting?.value === "true") {
        await db.update(payments)
          .set({ status: "approved", approvedAt: new Date() })
          .where(eq(payments.id, newPayment.id));
        
        if (carId) {
          await db.update(cars)
            .set({ isActive: true })
            .where(eq(cars.id, carId));
        }
        
        return res.json({ ...newPayment, status: "approved", message: "تم قبول الدفع تلقائياً" });
      }
      
      res.json({ ...newPayment, message: "تم استلام طلب الدفع. يرجى الانتظار للموافقة" });
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.get("/api/payments/my", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const userPayments = await db.select().from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt));
      
      res.json(userPayments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Admin Payment Management
  app.get("/api/admin/payments", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const allPayments = await db.select({
        payment: payments,
        user: users,
        car: cars,
      })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .leftJoin(cars, eq(payments.carId, cars.id))
        .orderBy(desc(payments.createdAt));
      
      res.json(allPayments);
    } catch (error) {
      console.error("Fetch admin payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.put("/api/admin/payments/:id/approve", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.admin!.id;
      
      const [payment] = await db.select().from(payments).where(eq(payments.id, id));
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      const [updatedPayment] = await db.update(payments)
        .set({ status: "approved", approvedBy: adminId, approvedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();
      
      if (payment.carId) {
        await db.update(cars)
          .set({ isActive: true })
          .where(eq(cars.id, payment.carId));
      }
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve payment" });
    }
  });

  app.put("/api/admin/payments/:id/reject", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = req.admin!.id;
      
      const [updatedPayment] = await db.update(payments)
        .set({ status: "rejected", approvedBy: adminId, approvedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject payment" });
    }
  });

  app.get("/api/admin/settings/auto-approve", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, "auto_approve_payments"));
      res.json({ autoApprove: setting?.value === "true" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get setting" });
    }
  });

  app.put("/api/admin/settings/auto-approve", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { autoApprove } = req.body;
      const value = autoApprove ? "true" : "false";
      
      const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, "auto_approve_payments"));
      
      if (existing) {
        await db.update(appSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(appSettings.key, "auto_approve_payments"));
      } else {
        await db.insert(appSettings).values({ key: "auto_approve_payments", value });
      }
      
      res.json({ autoApprove: value === "true" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Coupon Code APIs
  app.post("/api/coupons/validate", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { code } = req.body;
      const userId = req.user!.id;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code required", valid: false });
      }
      
      const [coupon] = await db.select().from(couponCodes)
        .where(and(
          eq(couponCodes.code, code.toUpperCase()),
          eq(couponCodes.isActive, true)
        ));
      
      if (!coupon) {
        return res.status(400).json({ error: "كود غير صالح", valid: false });
      }
      
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "انتهت صلاحية الكود", valid: false });
      }
      
      if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: "تم استخدام الكود بالكامل", valid: false });
      }
      
      const [existingUsage] = await db.select().from(couponUsages)
        .where(and(
          eq(couponUsages.couponId, coupon.id),
          eq(couponUsages.userId, userId)
        ));
      
      if (existingUsage) {
        return res.status(400).json({ error: "لقد استخدمت هذا الكود من قبل", valid: false });
      }
      
      res.json({ 
        valid: true, 
        discountPercent: coupon.discountPercent,
        message: coupon.discountPercent === 100 ? "مجاني!" : `خصم ${coupon.discountPercent}%`
      });
    } catch (error) {
      console.error("Validate coupon error:", error);
      res.status(500).json({ error: "Failed to validate coupon", valid: false });
    }
  });

  app.post("/api/coupons/apply", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { code, carId } = req.body;
      const userId = req.user!.id;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code required" });
      }
      
      const [coupon] = await db.select().from(couponCodes)
        .where(and(
          eq(couponCodes.code, code.toUpperCase()),
          eq(couponCodes.isActive, true)
        ));
      
      if (!coupon) {
        return res.status(400).json({ error: "كود غير صالح" });
      }
      
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "انتهت صلاحية الكود" });
      }
      
      if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: "تم استخدام الكود بالكامل" });
      }
      
      const [existingUsage] = await db.select().from(couponUsages)
        .where(and(
          eq(couponUsages.couponId, coupon.id),
          eq(couponUsages.userId, userId)
        ));
      
      if (existingUsage) {
        return res.status(400).json({ error: "لقد استخدمت هذا الكود من قبل" });
      }
      
      await db.insert(couponUsages).values({
        couponId: coupon.id,
        userId,
        carId,
      });
      
      await db.update(couponCodes)
        .set({ usedCount: (coupon.usedCount || 0) + 1 })
        .where(eq(couponCodes.id, coupon.id));
      
      if (carId) {
        await db.update(cars)
          .set({ isActive: true })
          .where(eq(cars.id, carId));
      }
      
      res.json({ 
        success: true, 
        message: "تم تطبيق الكود بنجاح!",
        discountPercent: coupon.discountPercent
      });
    } catch (error) {
      console.error("Apply coupon error:", error);
      res.status(500).json({ error: "Failed to apply coupon" });
    }
  });

  // Admin Coupon Management
  app.get("/api/admin/coupons", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const allCoupons = await db.select().from(couponCodes).orderBy(desc(couponCodes.createdAt));
      res.json(allCoupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { code, discountPercent, maxUses, expiresAt } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }
      
      const [newCoupon] = await db.insert(couponCodes).values({
        code: code.toUpperCase(),
        discountPercent: discountPercent || 100,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();
      
      res.json(newCoupon);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Coupon code already exists" });
      }
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(couponCodes).where(eq(couponCodes.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  // Privacy Policy API
  app.get("/api/privacy-policy", async (req: Request, res: Response) => {
    res.json({
      title: "سياسة الخصوصية - عربتي",
      titleEn: "Privacy Policy - Arabaty",
      lastUpdated: "2025-12-27",
      content: {
        ar: `
سياسة الخصوصية لتطبيق عربتي

آخر تحديث: ديسمبر 2025

مرحباً بك في تطبيق عربتي، السوق الأول للسيارات في السودان. نحن نقدر ثقتك بنا ونلتزم بحماية خصوصيتك.

1. المعلومات التي نجمعها:
- معلومات الحساب: رقم الهاتف، البريد الإلكتروني، الاسم
- معلومات الموقع: المدينة والموقع الجغرافي (بإذنك)
- بيانات الإعلانات: صور السيارات، الأسعار، الوصف
- معلومات التواصل: سجل المحادثات والعروض

2. كيف نستخدم معلوماتك:
- تمكينك من نشر وتصفح إعلانات السيارات
- تسهيل التواصل بين البائعين والمشترين
- تحسين تجربة المستخدم
- إرسال إشعارات مهمة حول حسابك

3. مشاركة المعلومات:
- لا نبيع معلوماتك الشخصية
- نشارك رقم هاتفك فقط مع المشترين/البائعين المهتمين
- قد نشارك البيانات مع الجهات القانونية عند الطلب

4. أمان البيانات:
- نستخدم تشفير SSL لحماية البيانات
- نخزن كلمات المرور بشكل مشفر
- ننفذ إجراءات أمنية صارمة

5. حقوقك:
- حذف حسابك في أي وقت
- تعديل معلوماتك الشخصية
- طلب نسخة من بياناتك

6. التواصل معنا:
للاستفسارات حول الخصوصية: privacy@arabaty.app
        `,
        en: `
Privacy Policy for Arabaty App

Last Updated: December 2025

Welcome to Arabaty, Sudan's first online car marketplace. We value your trust and are committed to protecting your privacy.

1. Information We Collect:
- Account Information: Phone number, email, name
- Location Information: City and geographic location (with your permission)
- Listing Data: Car photos, prices, descriptions
- Communication Information: Chat history and offers

2. How We Use Your Information:
- Enable you to post and browse car listings
- Facilitate communication between buyers and sellers
- Improve user experience
- Send important notifications about your account

3. Information Sharing:
- We do not sell your personal information
- We share your phone number only with interested buyers/sellers
- We may share data with legal authorities when required

4. Data Security:
- We use SSL encryption to protect data
- Passwords are stored encrypted
- We implement strict security measures

5. Your Rights:
- Delete your account at any time
- Modify your personal information
- Request a copy of your data

6. Contact Us:
For privacy inquiries: privacy@arabaty.app
        `
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
