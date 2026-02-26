import {
  admins,
  appSettings,
  buyerOffers,
  cars,
  couponCodes,
  couponUsages,
  favorites,
  inspectionRequests,
  payments,
  reports,
  serviceCategories,
  serviceProviders,
  sliderImages,
  users
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Express, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { createServer, type Server } from "node:http";
import { db } from "./db";

// Initialize Google Client - user needs to set this env var
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET_RAW = process.env.SESSION_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error(
    "FATAL: SESSION_SECRET environment variable is required for JWT authentication",
  );
}
const JWT_SECRET: string = JWT_SECRET_RAW;

const adminLoginAttempts = new Map<
  string,
  { count: number; blockedUntil: number }
>();
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_BLOCK_DURATION_MS = 5 * 60 * 1000;

import * as fs from "fs";
import multer from "multer";
import * as path from "path";

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Helper to check admin login limits
function checkAdminLoginAllowed(ip: string): {
  allowed: boolean;
  remainingTime?: number;
} {
  const now = Date.now();
  const record = adminLoginAttempts.get(ip);

  if (!record) return { allowed: true };

  if (now < record.blockedUntil) {
    return {
      allowed: false,
      remainingTime: Math.ceil((record.blockedUntil - now) / 1000 / 60),
    };
  }

  if (record.count >= ADMIN_MAX_ATTEMPTS && now >= record.blockedUntil) {
    adminLoginAttempts.delete(ip);
  }

  return { allowed: true };
}

function recordAdminLoginFailure(ip: string): void {
  const now = Date.now();
  const record = adminLoginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count++;

  if (record.count >= ADMIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + ADMIN_BLOCK_DURATION_MS;
  }

  adminLoginAttempts.set(ip, record);
}

function clearAdminLoginAttempts(ip: string): void {
  adminLoginAttempts.delete(ip);
}

interface AuthRequest extends Request {
  user?: { id: string; phone: string; roles: string[] };
  admin?: { id: string; email: string; role: string; permissions?: string[] };
}


async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      phone: string;
      roles: string[];
    };

    // Verify user status in DB
    try {
      const [user] = await db.select().from(users).where(eq(users.id, decoded.id));

      if (!user) {
        return res.status(401).json({ error: "USER_DELETED" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
      }

      req.user = { id: user.id, phone: user.phone, roles: user.roles };
      next();
    } catch (err) {
      console.error("Auth middleware DB check failed", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(); // Proceed as guest
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      phone: string;
      roles: string[];
    };

    // Verify user status in DB
    try {
      const [user] = await db.select().from(users).where(eq(users.id, decoded.id));

      if (user) {
        if (!user.isActive) {
          return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
        }
        req.user = { id: user.id, phone: user.phone, roles: user.roles };
      }
      next();
    } catch (err) {
      console.error("Optional auth middleware DB check failed", err);
      next(); // Proceed as guest if DB fails? Or fail? Better proceed or fail silent.
    }

  } catch {
    next(); // Invalid token -> proceed as guest (or should return 401 if token is present but invalid? Usually better to ignore bad token for optional auth, or return 401. Let's return 401 to be strict if they try to send one)
    // Actually for optional auth, if token is bad, we usually treat as guest.
  }
}

function adminAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin authorization required" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      isAdmin: boolean;
    };
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    (async () => {
      try {
        const [admin] = await db.select().from(admins).where(eq(admins.id, decoded.id));
        if (!admin || !admin.isActive) {
          return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
        }
        req.admin = { ...decoded, permissions: admin.permissions || [] };

        // Update last seen asynchronously
        await db.update(admins)
          .set({ lastSeen: new Date() })
          .where(eq(admins.id, admin.id));

        next();
      } catch (err) {
        console.error("Admin auth middleware DB check failed", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    })();
  } catch {
    return res.status(401).json({ error: "Invalid admin token" });
  }
}

async function ensureDefaultAdmin() {
  try {
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, "arab"))
      .limit(1);

    const newPasswordHash = await bcrypt.hash("11223344", 12);

    if (!existingAdmin) {
      // Only create if not exists
      await db.insert(admins).values({
        email: "arab",
        passwordHash: newPasswordHash,
        name: "Admin",
        role: "super_admin",
        isActive: true,
      });
      console.log("[ADMIN] Default admin created: arab with password 11223344");
    } else {
      console.log("[ADMIN] Admin 'arab' already exists. Skipping password reset.");
    }
  } catch (error) {
    console.error("[ADMIN] Error ensuring default admin:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  await ensureDefaultAdmin();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/terms", (_req: Request, res: Response) => {
    res.sendFile("terms.html", { root: "./server/templates" });
  });

  app.get("/privacy-policy", (_req: Request, res: Response) => {
    res.sendFile("privacy-policy.html", { root: "./server/templates" });
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  }, (req, res, next) => {
    const safePath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(process.cwd(), "uploads", safePath);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Upload endpoint
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }

      // Add watermark
      try {
        const sharp = require('sharp');
        const imagePath = req.file.path;
        const watermarkPath = path.join(process.cwd(), "assets", "images", "sudamark_logo.png");

        if (fs.existsSync(watermarkPath)) {
          const imageMetadata = await sharp(imagePath).metadata();
          // Resize watermark to be roughly 50% of the image width to be prominent in the center
          const targetWidth = imageMetadata.width ? Math.floor(imageMetadata.width * 0.5) : 300;

          const watermarkImg = await sharp(watermarkPath)
            .resize(targetWidth)
            .png()
            .toBuffer();

          const watermarkMeta = await sharp(watermarkImg).metadata();

          // Use an SVG to apply 30% opacity to the watermark
          const svgOverlay = Buffer.from(
            `<svg width="${watermarkMeta.width}" height="${watermarkMeta.height}"><image href="data:image/png;base64,${watermarkImg.toString('base64')}" width="100%" height="100%" opacity="0.3"/></svg>`
          );

          const tempPath = imagePath + '_temp' + path.extname(imagePath);
          await sharp(imagePath)
            .composite([
              {
                input: svgOverlay,
                gravity: 'center',
              }
            ])
            .toFile(tempPath);

          fs.copyFileSync(tempPath, imagePath);
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        console.error("Watermark processing error:", e);
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // --- Auth Routes ---
  // Replaced OTP/MagicLink with Direct Phone Login since user requested removing auth complexity

  // Strict limiter for auth routes
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: { error: "Too many login attempts, please try again later." },
  });

  app.post(
    "/api/auth/login",
    authLimiter,
    async (req: Request, res: Response) => {
      try {
        const { phone, password, googleId } = req.body;

        if (googleId || req.body.googleToken) {
          // Google Login Logic
          let verifiedGoogleId = googleId;
          let email = "";
          let name = "";
          let picture = "";

          if (req.body.googleToken) {
            try {
              const ticket = await googleClient.verifyIdToken({
                idToken: req.body.googleToken,
                audience: [
                  process.env.GOOGLE_CLIENT_ID!,
                  process.env.ANDROID_CLIENT_ID!,
                  process.env.IOS_CLIENT_ID!
                ].filter(Boolean),
              });
              const payload = ticket.getPayload();
              if (payload) {
                verifiedGoogleId = payload.sub;
                email = payload.email || "";
                name = payload.name || "";
                picture = payload.picture || "";
              }
            } catch (error) {
              console.error("Token verification failed:", error);
              return res.status(401).json({ error: "Invalid Google Token" });
            }
          }

          // Fallback for dev/mock if googleId provided directly (optional, maybe remove for prod)
          // strict: if googleToken is present, use verifiedGoogleId.
          const finalId = verifiedGoogleId;

          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, finalId))
            .limit(1);

          if (existingUser) {
            if (!existingUser.isActive) {
              return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
            }
            const token = jwt.sign(
              {
                id: existingUser.id,
                phone: existingUser.phone,
                roles: existingUser.roles,
              },
              JWT_SECRET,
              { expiresIn: "30d" },
            );
            return res.json({ user: existingUser, token, isNewUser: false });
          } else {
            // Check if user exists by email (to link account)
            if (email) {
              const [emailUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
              if (emailUser) {
                if (!emailUser.isActive) {
                  return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
                }
                // Start of linking account logic, but for now just return isNewUser with extra details
                // or auto-link?. Let's return isNewUser = true but with flag 'linkAccount' or just googleId
                // Actually, if we link, we need to update the user.
                // Let's update the user with googleId if they exist by email?
                // Safe approach: ask them to login with password to link? 
                // Or if email is verified (Google always verified), auto-link.
                await db.update(users).set({ googleId: finalId, authProvider: 'google' }).where(eq(users.id, emailUser.id));

                const token = jwt.sign(
                  { id: emailUser.id, phone: emailUser.phone, roles: emailUser.roles },
                  JWT_SECRET,
                  { expiresIn: "30d" }
                );
                return res.json({ user: emailUser, token, isNewUser: false });
              }
            }

            return res.json({
              isNewUser: true,
              googleId: finalId,
              email,
              name,
              picture
            });
          }
        }

        if (!phone || !password) {
          return res.status(400).json({ error: "Phone and password are required" });
        }

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);

        if (!existingUser) {
          return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!existingUser.isActive) {
          return res.status(401).json({ error: "ACCOUNT_BLOCKED" });
        }

        // Verify Password
        if (existingUser.passwordHash) {
          const isValid = await bcrypt.compare(password, existingUser.passwordHash);
          if (!isValid) {
            return res.status(400).json({ error: "Invalid credentials" });
          }
        } else {
          // Legacy user or Google user trying to login with password - minimal fallback or deny
          return res.status(400).json({ error: "Please login with your social account or reset password" });
        }

        const token = jwt.sign(
          {
            id: existingUser.id,
            phone: existingUser.phone,
            roles: existingUser.roles,
          },
          JWT_SECRET,
          { expiresIn: "30d" },
        );
        return res.json({ user: existingUser, token, isNewUser: false });

      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
      }
    },
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { phone, email, name, roles, countryCode, city, password, googleId } = req.body;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      if (email) {
        const [existingEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }

      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const [newUser] = await db
        .insert(users)
        .values({
          phone,
          email: email || null,
          emailVerified: false,
          name,
          roles: roles || ["buyer"],
          countryCode: countryCode || "+249",
          city: city || null,
          passwordHash,
          googleId: googleId || null,
          authProvider: googleId ? "google" : "phone",
        })
        .returning();

      const token = jwt.sign(
        { id: newUser.id, phone: newUser.phone, roles: newUser.roles },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      res.json({ user: newUser, token });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Temporary Migration Route for Legacy Users
  app.post("/api/auth/migrate-legacy-users", async (req: Request, res: Response) => {
    try {
      const defaultPassword = "12345678";
      const hash = await bcrypt.hash(defaultPassword, 10);

      // drizzle-orm doesn't have isNull helper imported? eq(users.passwordHash, null) might work or sql
      // I will use sql for safety if I am not sure about eq(.., null)
      await db.update(users)
        .set({ passwordHash: hash })
        .where(sql`${users.passwordHash} IS NULL`);

      res.json({ message: "Legacy users migrated (Default Password: 12345678)" });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  app.get(
    "/api/users/me",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, req.user!.id));
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
      }
    },
  );

  app.put(
    "/api/users/me",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { name, roles, phone, city } = req.body;

        // Prepare update object
        const updateData: any = { updatedAt: new Date() };
        if (name) updateData.name = name;
        if (roles) updateData.roles = roles;
        if (phone) updateData.phone = phone;
        if (city) updateData.city = city;

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, req.user!.id))
          .returning();
        res.json(updatedUser);
      } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
      }
    },
  );

  // --- Car Routes ---

  app.get("/api/cars", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
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
        conditions.push(
          or(
            like(cars.make, `%${search}%`),
            like(cars.model, `%${search}%`),
            like(cars.description, `%${search}%`),
          )!,
        );
      }

      const result = await db
        .select()
        .from(cars)
        .leftJoin(users, eq(cars.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(cars.createdAt));

      const allCars = result.map((row) => ({
        ...row.cars,
        user: row.users
          ? {
            id: row.users.id,
            name: row.users.name,
            phone: row.users.phone,
          }
          : undefined,
      }));

      res.json(allCars);
    } catch (error) {
      console.error("Fetch cars error:", error);
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  app.get("/api/cars/featured", optionalAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(cars)
        .leftJoin(users, eq(cars.userId, users.id))
        .where(and(eq(cars.isActive, true), eq(cars.isFeatured, true)))
        .orderBy(desc(cars.createdAt))
        .limit(10);

      const featuredCars = result.map((row) => ({
        ...row.cars,
        user: row.users
          ? {
            id: row.users.id,
            name: row.users.name,
            phone: row.users.phone,
            avatar: row.users.avatar,
          }
          : undefined,
      }));

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

      const [owner] = await db
        .select({
          id: users.id,
          name: users.name,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, car.userId));

      res.json({ ...car, owner });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  app.post(
    "/api/cars",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const carData = {
          ...req.body,
          userId: req.user!.id,
          isActive: false, // Default to pending approval
        };
        // Validation logic removed per request
        const [newCar] = await db.insert(cars).values(carData).returning();
        res.json(newCar);
      } catch (error) {
        console.error("Create car error:", error);
        res.status(500).json({ error: "Failed to create car listing" });
      }
    },
  );

  app.put(
    "/api/cars/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const [existingCar] = await db
          .select()
          .from(cars)
          .where(eq(cars.id, id));

        if (!existingCar) {
          return res.status(404).json({ error: "Car not found" });
        }
        if (existingCar.userId !== req.user!.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to edit this car" });
        }

        const {
          make,
          model,
          year,
          price,
          mileage,
          fuelType,
          transmission,
          color,
          city,
          description,
          insuranceType,
          advertiserType,
          engineSize,
          images,
          category,
          seats,
          doors,
          exteriorColor,
          interiorColor,
          gearType,
          cylinders,
          wheels,
          seatType,
        } = req.body;

        const [updatedCar] = await db
          .update(cars)
          .set({
            make,
            model,
            year,
            price,
            mileage,
            fuelType,
            transmission,
            color,
            city,
            description,
            insuranceType,
            advertiserType,
            engineSize,
            images,
            category,
            updatedAt: new Date(),
            isActive: false,
            seats,
            doors,
            exteriorColor,
            interiorColor,
            gearType,
            cylinders,
            wheels,
            seatType,
          }) // Reset approval on edit
          .where(eq(cars.id, id))
          .returning();
        res.json(updatedCar);
      } catch (error) {
        res.status(500).json({ error: "Failed to update car" });
      }
    },
  );

  app.patch(
    "/api/cars/:id/sold",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { isSold } = req.body;

        const [existingCar] = await db
          .select()
          .from(cars)
          .where(eq(cars.id, id));

        if (!existingCar) {
          return res.status(404).json({ error: "Car not found" });
        }
        if (existingCar.userId !== req.user!.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to edit this car" });
        }

        const [updatedCar] = await db
          .update(cars)
          .set({ isSold, updatedAt: new Date() })
          .where(eq(cars.id, id))
          .returning();

        res.json(updatedCar);
      } catch (error) {
        console.error("Toggle sold status error:", error);
        res.status(500).json({ error: "Failed to update sold status" });
      }
    }
  );

  // --- Service Category Routes (Admin) ---

  app.get("/api/service-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await db.select().from(serviceCategories).orderBy(serviceCategories.createdAt);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service categories" });
    }
  });

  app.post("/api/service-categories", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { key, nameAr, nameEn, icon } = req.body;
      const [newCategory] = await db
        .insert(serviceCategories)
        .values({ key, nameAr, nameEn, icon })
        .returning();
      res.json(newCategory);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service category" });
    }
  });

  app.put("/api/service-categories/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { key, nameAr, nameEn, icon } = req.body;
      const [updatedCategory] = await db
        .update(serviceCategories)
        .set({ key, nameAr, nameEn, icon })
        .where(eq(serviceCategories.id, id))
        .returning();
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service category" });
    }
  });

  app.delete("/api/service-categories/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service category" });
    }
  });

  app.delete(
    "/api/cars/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const [existingCar] = await db
          .select()
          .from(cars)
          .where(eq(cars.id, id));

        if (!existingCar) {
          return res.status(404).json({ error: "Car not found" });
        }
        if (existingCar.userId !== req.user!.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to delete this car" });
        }

        // Delete associated images
        if (existingCar.images && Array.isArray(existingCar.images)) {
          for (const imageUrl of existingCar.images) {
            if (typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
              const filename = imageUrl.split('/uploads/')[1];
              const filePath = path.join(process.cwd(), "uploads", filename);
              try {
                if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath);
                }
              } catch (err) {
                console.error(`Failed to delete file: ${filePath}`, err);
              }
            }
          }
        }

        await db.delete(cars).where(eq(cars.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete car" });
      }
    },
  );

  app.get(
    "/api/my-cars",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const myCars = await db
          .select()
          .from(cars)
          .where(eq(cars.userId, req.user!.id))
          .orderBy(desc(cars.createdAt));
        res.json(myCars);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch your cars" });
      }
    },
  );

  // --- Admin Routes ---

  app.get(
    "/api/admin/cars",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const allCars = await db
          .select({
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
        res.status(500).json({ error: "Failed to fetch cars for admin" });
      }
    },
  );

  app.put(
    "/api/admin/cars/:id/status",
    adminAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const authReq = req as AuthRequest;
        if (authReq.admin!.role !== "admin" && authReq.admin!.role !== "super_admin" && !authReq.admin!.permissions?.includes("cars")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const { isActive, isFeatured } = req.body;

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No update data provided" });
        }

        const [updatedCar] = await db
          .update(cars)
          .set(updateData)
          .where(eq(cars.id, id))
          .returning();

        res.json(updatedCar);
      } catch (error) {
        res.status(500).json({ error: "Failed to update car status" });
      }
    },
  );

  app.get("/api/service-providers", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { type, city } = req.query;
      const userId = req.user?.id;

      // Build base conditions
      let conditions: any[] = [];

      if (type && typeof type === "string") {
        conditions.push(eq(serviceProviders.type, type));
      }
      if (city && typeof city === "string") {
        conditions.push(eq(serviceProviders.city, city));
      }

      // Visibility logic: show active providers OR user's own inactive providers
      if (userId) {
        // Authenticated: active OR (inactive AND owned by user)
        conditions.push(
          or(
            eq(serviceProviders.isActive, true),
            eq(serviceProviders.userId, userId)
          )
        );
      } else {
        // Not authenticated: only active providers
        conditions.push(eq(serviceProviders.isActive, true));
      }

      const providers = await db
        .select()
        .from(serviceProviders)
        .where(and(...conditions))
        .orderBy(desc(serviceProviders.rating));

      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service providers" });
    }
  });

  // User-facing endpoint to create service provider (pending approval)
  app.post(
    "/api/service-providers",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { name, type, phone, city, address, description } = req.body;

        // Validate required fields
        if (!name || !type || !phone || !city) {
          return res.status(400).json({
            error: "Missing required fields: name, type, phone, and city are required"
          });
        }

        const [newProvider] = await db
          .insert(serviceProviders)
          .values({
            userId: req.user!.id,
            name,
            type,
            phone,
            city,
            address: address || null,
            description: description || null,
            isActive: false, // User-created = pending approval
          })
          .returning();

        res.status(201).json(newProvider);
      } catch (error) {
        console.error("Create service provider error:", error);
        res.status(500).json({ error: "Failed to create service provider" });
      }
    }
  );

  app.get("/api/service-providers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [provider] = await db
        .select()
        .from(serviceProviders)
        .where(eq(serviceProviders.id, id));
      if (!provider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service provider" });
    }
  });

  app.get("/api/slider-images", optionalAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const images = await db
        .select()
        .from(sliderImages)
        .where(eq(sliderImages.isActive, true))
        .orderBy(sliderImages.order);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slider images" });
    }
  });

  app.get(
    "/api/favorites",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const userFavorites = await db
          .select({
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
    },
  );

  app.post(
    "/api/favorites",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { carId } = req.body;

        const [existing] = await db
          .select()
          .from(favorites)
          .where(
            and(eq(favorites.userId, req.user!.id), eq(favorites.carId, carId)),
          );

        if (existing) {
          return res.status(400).json({ error: "Already in favorites" });
        }

        const [newFavorite] = await db
          .insert(favorites)
          .values({ userId: req.user!.id, carId })
          .returning();
        res.json(newFavorite);
      } catch (error) {
        res.status(500).json({ error: "Failed to add favorite" });
      }
    },
  );

  app.delete(
    "/api/favorites/:carId",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { carId } = req.params;
        await db
          .delete(favorites)
          .where(
            and(eq(favorites.userId, req.user!.id), eq(favorites.carId, carId)),
          );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove favorite" });
      }
    },
  );

  app.post(
    "/api/admin/login",
    async (req: Request, res: Response) => {
      try {
        const clientIp = req.ip || req.socket.remoteAddress || "unknown";
        const deviceId = req.header("x-device-id");
        const limitKey = (typeof deviceId === 'string' && deviceId) ? `device:${deviceId}` : clientIp;

        const { email, password } = req.body;

        const loginCheck = checkAdminLoginAllowed(limitKey);
        if (!loginCheck.allowed) {
          return res.status(403).json({
            error: `تم حظر جهازك لمدة ${loginCheck.remainingTime} دقيقة بسبب محاولات تسجيل دخول فاشلة متعددة`,
          });
        }

        const [admin] = await db
          .select()
          .from(admins)
          .where(and(eq(admins.email, email), eq(admins.isActive, true)));

        if (!admin) {
          recordAdminLoginFailure(limitKey);
          console.log(
            `[ADMIN SECURITY] Failed login attempt from IP: ${clientIp} - Invalid email`,
          );
          return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
        }

        const isValidPassword = await bcrypt.compare(
          password,
          admin.passwordHash,
        );
        if (!isValidPassword) {
          recordAdminLoginFailure(limitKey);
          console.log(
            `[ADMIN SECURITY] Failed login attempt from IP: ${clientIp} - Invalid password`,
          );
          return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
        }

        clearAdminLoginAttempts(limitKey);
        console.log(
          `[ADMIN SECURITY] Successful login from IP: ${clientIp} for admin: ${admin.email}`,
        );

        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: admin.role, isAdmin: true },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.json({
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: admin.permissions,
          },
          token,
        });
      } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "فشل تسجيل الدخول" });
      }
    },
  );

  app.post(
    "/api/admin/change-password",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.admin!.id;

        const [admin] = await db
          .select()
          .from(admins)
          .where(eq(admins.id, adminId));

        if (!admin) {
          return res.status(404).json({ error: "Admin not found" });
        }

        const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!isValid) {
          return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await db
          .update(admins)
          .set({ passwordHash })
          .where(eq(admins.id, adminId));

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to change password" });
      }
    },
  );

  // Employee Management Routes
  app.get(
    "/api/admin/employees",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const employees = await db
          .select({
            id: admins.id,
            name: admins.name,
            email: admins.email,
            role: admins.role,
            permissions: admins.permissions,
            isActive: admins.isActive,
            lastSeen: admins.lastSeen,
            createdAt: admins.createdAt,
          })
          .from(admins)
          .where(eq(admins.role, "employee"))
          .orderBy(desc(admins.createdAt));

        res.json(employees);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch employees" });
      }
    },
  );

  app.post(
    "/api/admin/employees",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const { name, email, password, permissions } = req.body;

        const [existing] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email));

        if (existing) {
          return res.status(400).json({ error: "Email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [newEmployee] = await db
          .insert(admins)
          .values({
            name,
            email,
            passwordHash,
            role: "employee",
            permissions: permissions || [],
            isActive: true,
          })
          .returning();

        res.json({
          id: newEmployee.id,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          permissions: newEmployee.permissions,
          isActive: newEmployee.isActive,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to create employee" });
      }
    },
  );

  app.put(
    "/api/admin/employees/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const { name, permissions, isActive, password } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (permissions) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) {
          updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const [updated] = await db
          .update(admins)
          .set(updateData)
          .where(eq(admins.id, id))
          .returning();

        res.json({
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          permissions: updated.permissions,
          isActive: updated.isActive,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to update employee" });
      }
    },
  );

  app.delete(
    "/api/admin/employees/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        await db.delete(admins).where(eq(admins.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete employee" });
      }
    },
  );

  app.get(
    "/api/admin/stats",
    adminAuthMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const [usersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);
        const [carsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(cars);
        const [activeCarsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(cars)
          .where(eq(cars.isActive, true));
        const [providersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(serviceProviders);

        const [employeesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(admins)
          .where(eq(admins.role, "employee"));

        res.json({
          totalUsers: Number(usersCount.count),
          totalCars: Number(carsCount.count),
          activeCars: Number(activeCarsCount.count),
          totalProviders: Number(providersCount.count),
          totalEmployees: Number(employeesCount.count),
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
      }
    },
  );

  app.get(
    "/api/admin/users",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("users")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const allUsers = await db
          .select()
          .from(users)
          .orderBy(desc(users.createdAt));
        res.json(allUsers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
      }
    },
  );

  app.post(
    "/api/admin/users",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("users") && !req.admin!.permissions?.includes("cars")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { phone, name, roles, countryCode, city, password } = req.body;

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);
        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }



        let passwordHash = null;
        if (password) {
          passwordHash = await bcrypt.hash(password, 10);
        }

        const [newUser] = await db
          .insert(users)
          .values({
            phone,
            email: null,
            emailVerified: false,
            name,
            roles: roles || ["buyer"],
            countryCode: countryCode || "+249",
            city: city || null,
            passwordHash,
            authProvider: "phone",
            isActive: true,
          })
          .returning();

        res.json(newUser);
      } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    },
  );

  app.put(
    "/api/admin/users/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("users")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const { name, phone, roles, isActive } = req.body;

        const updateData: any = { updatedAt: new Date() };
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (roles) updateData.roles = roles;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, id))
          .returning();

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json(updatedUser);
      } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
    },
  );

  app.delete(
    "/api/admin/users/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("users")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;

        // 1. Get user's cars
        const userCars = await db.select().from(cars).where(eq(cars.userId, id));
        const carIds = userCars.map((c) => c.id);

        // 2. Delete dependencies of those cars
        if (carIds.length > 0) {
          // Delete favorites for these cars
          await db.delete(favorites).where(inArray(favorites.carId, carIds));
          // Delete offers for these cars
          await db.delete(buyerOffers).where(inArray(buyerOffers.carId, carIds));
          // Delete inspection requests for these cars
          await db.delete(inspectionRequests).where(inArray(inspectionRequests.carId, carIds));
          // Delete payments linked to these cars (optional but safer)
          await db.delete(payments).where(inArray(payments.carId, carIds));
          // Delete car images? They are JSONB in cars table, so they go with the car row.

          // Finally delete the cars
          await db.delete(cars).where(inArray(cars.id, carIds));
        }

        // 3. Delete user's direct dependencies
        await db.delete(favorites).where(eq(favorites.userId, id));
        await db.delete(buyerOffers).where(eq(buyerOffers.buyerId, id));
        await db.delete(inspectionRequests).where(or(eq(inspectionRequests.buyerId, id), eq(inspectionRequests.sellerId, id)));
        await db.delete(reports).where(eq(reports.userId, id));
        await db.delete(serviceProviders).where(eq(serviceProviders.userId, id));
        // We might want to keep payments for accounting, but for now assuming full wipe
        // await db.delete(payments).where(eq(payments.userId, id)); 

        // 4. Delete the user
        await db.delete(users).where(eq(users.id, id));

        res.json({ success: true });
      } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
      }
    },
  );

  app.post(
    "/api/admin/cars",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("cars")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const {
          make,
          model,
          year,
          price,
          mileage,
          city,
          transmission,
          fuelType,
          description,
          userId,
          insuranceType,
          advertiserType,
          engineSize,
          color,
          userPhone,
          images,
          category,
          condition,
          exteriorColor,
          interiorColor,
          gearType,
          seatType,
          cylinders,
          wheels,
          doors,
          seats,
        } = req.body;

        console.log("Create car request body:", JSON.stringify(req.body));
        console.log("User phone provided:", userPhone);

        let ownerId = userId;
        if (userPhone) {
          console.log("Looking up user by phone:", userPhone);
          const [phoneUser] = await db.select().from(users).where(eq(users.phone, userPhone)).limit(1);
          if (phoneUser) {
            console.log("Found user:", phoneUser.id);
            ownerId = phoneUser.id;
          } else {
            console.log("User not found for phone:", userPhone);

            // Check if force create is requested
            const { forceCreateUser } = req.body;

            if (!forceCreateUser) {
              return res.status(404).json({
                error: "User with this phone not found",
                code: "USER_NOT_FOUND_CONFIRM"
              });
            }

            // Create new user if confirmed
            const hashedPassword = await bcrypt.hash("12345678", 10);
            const [newUser] = await db
              .insert(users)
              .values({
                phone: userPhone,
                passwordHash: hashedPassword,
                name: "User " + userPhone,
                roles: ["buyer"],
                countryCode: "+249",
                authProvider: "phone",
                isActive: true,
              })
              .returning();
            ownerId = newUser.id;
          }
        }

        if (!ownerId) {
          const [adminUser] = await db
            .select()
            .from(users)
            .where(eq(users.name, "Admin"))
            .limit(1);
          if (adminUser) {
            ownerId = adminUser.id;
          } else {
            const [newAdmin] = await db
              .insert(users)
              .values({
                name: "Admin",
                phone: "0000000000",
                roles: ["admin"],
              })
              .returning();
            ownerId = newAdmin.id;
          }
        }

        const [newCar] = await db
          .insert(cars)
          .values({
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
            insuranceType,
            advertiserType,
            engineSize,
            color,
            category: category || "sedan",
            condition: condition || "used",
            exteriorColor,
            interiorColor,
            gearType,
            seatType,
            cylinders,
            wheels,
            doors,
            seats,
            isActive: true,
            isFeatured: false,
            images: images || [],
          })
          .returning();
        res.json(newCar);
      } catch (error) {
        console.error("Failed to create car:", error);
        res.status(500).json({ error: "Failed to create car" });
      }
    },
  );

  app.put(
    "/api/admin/cars/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("cars")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const {
          isActive,
          isFeatured,
          make,
          model,
          year,
          price,
          mileage,
          city,
          transmission,

          fuelType,
          description,
          userId,
          userPhone,
          category,
          condition,
          insuranceType,
          advertiserType,
          engineSize,
          exteriorColor,
          interiorColor,
          gearType,
          seatType,
          cylinders,
          wheels,
          doors,
          seats,
          images,
        } = req.body;

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

        if (userId) updateData.userId = userId;
        if (category) updateData.category = category;
        if (condition) updateData.condition = condition;
        if (insuranceType) updateData.insuranceType = insuranceType;
        if (advertiserType) updateData.advertiserType = advertiserType;
        if (engineSize) updateData.engineSize = engineSize;
        if (exteriorColor) updateData.exteriorColor = exteriorColor;
        if (interiorColor) updateData.interiorColor = interiorColor;
        if (gearType) updateData.gearType = gearType;
        if (seatType) updateData.seatType = seatType;
        if (cylinders) updateData.cylinders = cylinders;
        if (wheels) updateData.wheels = wheels;
        if (doors) updateData.doors = doors;
        if (seats) updateData.seats = seats;
        if (images) updateData.images = images;
        if (userPhone) {
          const [phoneUser] = await db.select().from(users).where(eq(users.phone, userPhone)).limit(1);
          if (phoneUser) {
            updateData.userId = phoneUser.id;
          }
          // If not found, we ignore or could error, but ignoring keeps current user if type-o. 
          // However, for admin panel it's better to be explicit.
          // But existing code structure allows partial updates. Let's just update if found.
        }

        const [updatedCar] = await db
          .update(cars)
          .set(updateData)
          .where(eq(cars.id, id))
          .returning();
        res.json(updatedCar);
      } catch (error) {
        res.status(500).json({ error: "Failed to update car" });
      }
    },
  );

  app.delete(
    "/api/admin/cars/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("cars")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        await db.delete(cars).where(eq(cars.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete car" });
      }
    },
  );

  app.get(
    "/api/admin/service-providers",
    adminAuthMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const providers = await db
          .select()
          .from(serviceProviders)
          .orderBy(desc(serviceProviders.createdAt));
        res.json(providers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch service providers" });
      }
    },
  );

  app.post(
    "/api/admin/service-providers",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("providers")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const [newProvider] = await db
          .insert(serviceProviders)
          .values({
            ...req.body,
            isActive: true, // Admin-created providers are active by default
          })
          .returning();
        res.json(newProvider);
      } catch (error) {
        res.status(500).json({ error: "Failed to create service provider" });
      }
    },
  );

  app.put(
    "/api/admin/service-providers/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("providers")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const [updatedProvider] = await db
          .update(serviceProviders)
          .set(req.body)
          .where(eq(serviceProviders.id, id))
          .returning();
        res.json(updatedProvider);
      } catch (error) {
        res.status(500).json({ error: "Failed to update service provider" });
      }
    },
  );

  app.delete(
    "/api/admin/service-providers/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("providers")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete service provider" });
      }
    },
  );

  app.get(
    "/api/admin/slider-images",
    adminAuthMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        if (_req.admin!.role !== "admin" && _req.admin!.role !== "super_admin" && !_req.admin!.permissions?.includes("ads")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const images = await db
          .select()
          .from(sliderImages)
          .orderBy(sliderImages.order);
        res.json(images);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch slider images" });
      }
    },
  );

  app.post(
    "/api/admin/slider-images",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("ads")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const [newImage] = await db
          .insert(sliderImages)
          .values(req.body)
          .returning();
        res.json(newImage);
      } catch (error) {
        res.status(500).json({ error: "Failed to create slider image" });
      }
    },
  );

  app.put(
    "/api/admin/slider-images/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("ads")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const [updatedImage] = await db
          .update(sliderImages)
          .set(req.body)
          .where(eq(sliderImages.id, id))
          .returning();
        res.json(updatedImage);
      } catch (error) {
        res.status(500).json({ error: "Failed to update slider image" });
      }
    },
  );

  app.delete(
    "/api/admin/slider-images/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("ads")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        await db.delete(sliderImages).where(eq(sliderImages.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete slider image" });
      }
    },
  );

  // Buyer Offers API
  app.post(
    "/api/offers",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { carId, offerPrice, message } = req.body;
        const buyerId = req.user!.id;

        const [car] = await db.select().from(cars).where(eq(cars.id, carId));
        if (!car) {
          return res.status(404).json({ error: "Car not found" });
        }

        if (car.userId === buyerId) {
          return res
            .status(400)
            .json({ error: "Cannot make an offer on your own car" });
        }

        const [newOffer] = await db
          .insert(buyerOffers)
          .values({
            carId,
            buyerId,
            offerPrice,
            message,
            status: "pending",
          })
          .returning();

        res.json(newOffer);
      } catch (error) {
        console.error("Create offer error:", error);
        res.status(500).json({ error: "Failed to create offer" });
      }
    },
  );

  app.get(
    "/api/offers/my-offers",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const buyerId = req.user!.id;
        const offers = await db
          .select()
          .from(buyerOffers)
          .where(eq(buyerOffers.buyerId, buyerId))
          .orderBy(desc(buyerOffers.createdAt));
        res.json(offers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch offers" });
      }
    },
  );

  app.get(
    "/api/offers/received",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerId = req.user!.id;
        const sellerCars = await db
          .select()
          .from(cars)
          .where(eq(cars.userId, sellerId));
        const carIds = sellerCars.map((c) => c.id);

        if (carIds.length === 0) {
          return res.json([]);
        }

        const offers = await db
          .select({
            offer: buyerOffers,
            car: cars,
            buyer: users,
          })
          .from(buyerOffers)
          .innerJoin(cars, eq(buyerOffers.carId, cars.id))
          .innerJoin(users, eq(buyerOffers.buyerId, users.id))
          .where(
            sql`${buyerOffers.carId} = ANY(${sql.raw(`ARRAY[${carIds.map((id) => `'${id}'`).join(",")}]::varchar[]`)})`,
          )
          .orderBy(desc(buyerOffers.createdAt));

        res.json(offers);
      } catch (error) {
        console.error("Fetch received offers error:", error);
        res.status(500).json({ error: "Failed to fetch received offers" });
      }
    },
  );

  app.put(
    "/api/offers/:id/status",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const sellerId = req.user!.id;

        const [offer] = await db
          .select()
          .from(buyerOffers)
          .where(eq(buyerOffers.id, id));
        if (!offer) {
          return res.status(404).json({ error: "Offer not found" });
        }

        const [car] = await db
          .select()
          .from(cars)
          .where(eq(cars.id, offer.carId));
        if (!car || car.userId !== sellerId) {
          return res
            .status(403)
            .json({ error: "Not authorized to update this offer" });
        }

        const [updatedOffer] = await db
          .update(buyerOffers)
          .set({ status })
          .where(eq(buyerOffers.id, id))
          .returning();

        res.json(updatedOffer);
      } catch (error) {
        res.status(500).json({ error: "Failed to update offer status" });
      }
    },
  );

  // Inspection Requests API
  app.post(
    "/api/inspection-requests",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { carId, message, scheduledAt, location } = req.body;
        const buyerId = req.user!.id;

        const [car] = await db.select().from(cars).where(eq(cars.id, carId));
        if (!car) {
          return res.status(404).json({ error: "Car not found" });
        }

        const [newRequest] = await db
          .insert(inspectionRequests)
          .values({
            carId,
            buyerId,
            sellerId: car.userId,
            message,
            scheduledAt,
            location,
            status: "pending",
          })
          .returning();

        res.json(newRequest);
      } catch (error) {
        console.error("Create inspection request error:", error);
        res.status(500).json({ error: "Failed to create inspection request" });
      }
    },
  );

  // Reports API
  app.post("/api/reports", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { targetId, targetType, reason, details } = req.body;
      const userId = req.user!.id;

      if (!targetId || !targetType || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newReport] = await db
        .insert(reports)
        .values({
          userId,
          targetId,
          targetType,
          reason,
          details,
          status: "pending",
        })
        .returning();

      res.json(newReport);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get(
    "/api/inspection-requests/received",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const sellerId = req.user!.id;
        const requests = await db
          .select({
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
    },
  );

  app.put(
    "/api/inspection-requests/:id/respond",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { status, sellerResponse } = req.body;
        const sellerId = req.user!.id;

        const [request] = await db
          .select()
          .from(inspectionRequests)
          .where(eq(inspectionRequests.id, id));
        if (!request || request.sellerId !== sellerId) {
          return res
            .status(403)
            .json({ error: "Not authorized to respond to this request" });
        }

        const [updatedRequest] = await db
          .update(inspectionRequests)
          .set({ status, sellerResponse, updatedAt: new Date() })
          .where(eq(inspectionRequests.id, id))
          .returning();

        res.json(updatedRequest);
      } catch (error) {
        res.status(500).json({ error: "Failed to update inspection request" });
      }
    },
  );

  // Payment System APIs
  const FREE_USER_LIMIT = 30000;
  const BASE_LISTING_FEE = 10000;

  const getCategoryFee = (category: string | null): number => {
    return 10000;
  };

  app.get("/api/listings/status", async (req: Request, res: Response) => {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      const totalUsers = Number(result?.count || 0);
      const requiresPayment = totalUsers >= FREE_USER_LIMIT;

      res.json({
        totalListings: totalUsers,
        freeLimit: FREE_USER_LIMIT,
        requiresPayment,
        listingFee: BASE_LISTING_FEE,
      });
    } catch (error) {
      console.error("Get listing status error:", error);
      res.status(500).json({ error: "Failed to get listing status" });
    }
  });

  app.post(
    "/api/payments",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { carId, trxNo, amount, paidAt } = req.body;
        const userId = req.user!.id;

        if (!trxNo || !amount || !paidAt) {
          return res
            .status(400)
            .json({ error: "Transaction details required" });
        }

        const [car] = await db.select().from(cars).where(eq(cars.id, carId));
        if (!car) {
          return res.status(404).json({ error: "Car not found" });
        }

        const requiredFee = getCategoryFee(car.category);

        if (amount < requiredFee) {
          return res.status(400).json({
            error: `Minimum payment for this category is ${requiredFee.toLocaleString()} SDG`,
          });
        }

        const [existingPayment] = await db
          .select()
          .from(payments)
          .where(eq(payments.trxNo, trxNo));
        if (existingPayment) {
          return res.status(400).json({ error: "Transaction ID already used" });
        }

        const [newPayment] = await db
          .insert(payments)
          .values({
            userId,
            carId,
            trxNo,
            amount,
            paidAt,
            status: "pending",
          })
          .returning();

        const [autoApproveSetting] = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, "auto_approve_payments"));
        if (autoApproveSetting?.value === "true") {
          await db
            .update(payments)
            .set({ status: "approved", approvedAt: new Date() })
            .where(eq(payments.id, newPayment.id));

          if (carId) {
            await db
              .update(cars)
              .set({ isActive: true })
              .where(eq(cars.id, carId));
          }

          return res.json({
            ...newPayment,
            status: "approved",
            message: "تم قبول الدفع تلقائياً",
          });
        }

        res.json({
          ...newPayment,
          message: "تم استلام طلب الدفع. يرجى الانتظار للموافقة",
        });
      } catch (error) {
        console.error("Create payment error:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    },
  );

  app.get(
    "/api/payments/my",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const userPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.userId, userId))
          .orderBy(desc(payments.createdAt));

        res.json(userPayments);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
      }
    },
  );

  // Admin Payment Management
  app.get(
    "/api/admin/payments",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("payments")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const allPayments = await db
          .select({
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
    },
  );

  app.put(
    "/api/admin/payments/:id/approve",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("payments")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const adminId = req.admin!.id;

        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, id));
        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        const [updatedPayment] = await db
          .update(payments)
          .set({
            status: "approved",
            approvedBy: adminId,
            approvedAt: new Date(),
          })
          .where(eq(payments.id, id))
          .returning();

        if (payment.carId) {
          await db
            .update(cars)
            .set({ isActive: true })
            .where(eq(cars.id, payment.carId));
        }

        res.json(updatedPayment);
      } catch (error) {
        res.status(500).json({ error: "Failed to approve payment" });
      }
    },
  );

  app.put(
    "/api/admin/payments/:id/reject",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("payments")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const adminId = req.admin!.id;

        const [updatedPayment] = await db
          .update(payments)
          .set({
            status: "rejected",
            approvedBy: adminId,
            approvedAt: new Date(),
          })
          .where(eq(payments.id, id))
          .returning();

        res.json(updatedPayment);
      } catch (error) {
        res.status(500).json({ error: "Failed to reject payment" });
      }
    },
  );

  app.get(
    "/api/admin/settings/auto-approve",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("payments")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const [setting] = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, "auto_approve_payments"));
        res.json({ autoApprove: setting?.value === "true" });
      } catch (error) {
        res.status(500).json({ error: "Failed to get setting" });
      }
    },
  );

  app.put(
    "/api/admin/settings/auto-approve",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (req.admin!.role !== "admin" && req.admin!.role !== "super_admin" && !req.admin!.permissions?.includes("payments")) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        const { autoApprove } = req.body;
        const value = autoApprove ? "true" : "false";

        const [existing] = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, "auto_approve_payments"));

        if (existing) {
          await db
            .update(appSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(appSettings.key, "auto_approve_payments"));
        } else {
          await db
            .insert(appSettings)
            .values({ key: "auto_approve_payments", value });
        }

        res.json({ autoApprove: value === "true" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update setting" });
      }
    },
  );

  // Coupon Code APIs
  app.post(
    "/api/coupons/validate",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { code } = req.body;
        const userId = req.user!.id;

        if (!code) {
          return res
            .status(400)
            .json({ error: "Coupon code required", valid: false });
        }

        const [coupon] = await db
          .select()
          .from(couponCodes)
          .where(
            and(
              eq(couponCodes.code, code.toUpperCase()),
              eq(couponCodes.isActive, true),
            ),
          );

        if (!coupon) {
          return res.status(400).json({ error: "كود غير صالح", valid: false });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res
            .status(400)
            .json({ error: "انتهت صلاحية الكود", valid: false });
        }

        if (
          coupon.maxUses &&
          coupon.usedCount &&
          coupon.usedCount >= coupon.maxUses
        ) {
          return res
            .status(400)
            .json({ error: "تم استخدام الكود بالكامل", valid: false });
        }

        const [existingUsage] = await db
          .select()
          .from(couponUsages)
          .where(
            and(
              eq(couponUsages.couponId, coupon.id),
              eq(couponUsages.userId, userId),
            ),
          );

        if (existingUsage) {
          return res
            .status(400)
            .json({ error: "لقد استخدمت هذا الكود من قبل", valid: false });
        }

        res.json({
          valid: true,
          discountPercent: coupon.discountPercent,
          message:
            coupon.discountPercent === 100
              ? "مجاني!"
              : `خصم ${coupon.discountPercent}%`,
        });
      } catch (error) {
        console.error("Validate coupon error:", error);
        res
          .status(500)
          .json({ error: "Failed to validate coupon", valid: false });
      }
    },
  );

  app.post(
    "/api/coupons/apply",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { code, carId } = req.body;
        const userId = req.user!.id;

        if (!code) {
          return res.status(400).json({ error: "Coupon code required" });
        }

        const [coupon] = await db
          .select()
          .from(couponCodes)
          .where(
            and(
              eq(couponCodes.code, code.toUpperCase()),
              eq(couponCodes.isActive, true),
            ),
          );

        if (!coupon) {
          return res.status(400).json({ error: "كود غير صالح" });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res.status(400).json({ error: "انتهت صلاحية الكود" });
        }

        if (
          coupon.maxUses &&
          coupon.usedCount &&
          coupon.usedCount >= coupon.maxUses
        ) {
          return res.status(400).json({ error: "تم استخدام الكود بالكامل" });
        }

        const [existingUsage] = await db
          .select()
          .from(couponUsages)
          .where(
            and(
              eq(couponUsages.couponId, coupon.id),
              eq(couponUsages.userId, userId),
            ),
          );

        if (existingUsage) {
          return res
            .status(400)
            .json({ error: "لقد استخدمت هذا الكود من قبل" });
        }

        await db.insert(couponUsages).values({
          couponId: coupon.id,
          userId,
          carId,
        });

        await db
          .update(couponCodes)
          .set({ usedCount: (coupon.usedCount || 0) + 1 })
          .where(eq(couponCodes.id, coupon.id));

        if (carId) {
          await db
            .update(cars)
            .set({ isActive: true })
            .where(eq(cars.id, carId));
        }

        res.json({
          success: true,
          message: "تم تطبيق الكود بنجاح!",
          discountPercent: coupon.discountPercent,
        });
      } catch (error) {
        console.error("Apply coupon error:", error);
        res.status(500).json({ error: "Failed to apply coupon" });
      }
    },
  );

  // Admin Coupon Management
  app.get(
    "/api/admin/coupons",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const allCoupons = await db
          .select()
          .from(couponCodes)
          .orderBy(desc(couponCodes.createdAt));
        res.json(allCoupons);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch coupons" });
      }
    },
  );

  app.post(
    "/api/admin/coupons",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { code, discountPercent, maxUses, expiresAt } = req.body;

        if (!code) {
          return res.status(400).json({ error: "Code is required" });
        }

        const [newCoupon] = await db
          .insert(couponCodes)
          .values({
            code: code.toUpperCase(),
            discountPercent: discountPercent || 100,
            maxUses: maxUses || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          })
          .returning();

        res.json(newCoupon);
      } catch (error: any) {
        if (error.code === "23505") {
          return res.status(400).json({ error: "Coupon code already exists" });
        }
        res.status(500).json({ error: "Failed to create coupon" });
      }
    },
  );

  app.delete(
    "/api/admin/coupons/:id",
    adminAuthMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        await db.delete(couponCodes).where(eq(couponCodes.id, id));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete coupon" });
      }
    },
  );

  // Cities API (Dynamic Cities)
  app.get("/api/cities", async (_req: Request, res: Response) => {
    const citiesList = [
      { id: "khartoum", nameEn: "Khartoum", nameAr: "الخرطوم" },
      { id: "bahri", nameEn: "Bahri", nameAr: "بحري" },
      { id: "omdurman", nameEn: "Omdurman", nameAr: "أم درمان" },
      { id: "portsudan", nameEn: "Port Sudan", nameAr: "بورتسودان" },
      { id: "kassala", nameEn: "Kassala", nameAr: "كسلا" },
      { id: "gezira", nameEn: "Al Gezira", nameAr: "الجزيرة" },
      { id: "kordofan", nameEn: "Kordofan", nameAr: "كردفان" },
      { id: "darfur", nameEn: "Darfur", nameAr: "دارفور" },
      { id: "river_nile", nameEn: "River Nile", nameAr: "نهر النيل" },
      { id: "white_nile", nameEn: "White Nile", nameAr: "النيل الأبيض" },
      { id: "blue_nile", nameEn: "Blue Nile", nameAr: "النيل الأزرق" },
      { id: "northern", nameEn: "Northern", nameAr: "الشمالية" },
      { id: "red_sea", nameEn: "Red Sea", nameAr: "البحر الأحمر" },
      { id: "gedaref", nameEn: "Al Qadarif", nameAr: "القضارف" },
      { id: "sennar", nameEn: "Sennar", nameAr: "سنار" },
    ];
    // In a real scenario, this could come from a DB table 'cities'
    res.json(citiesList);
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
- للاستفسارات حول الخصوصية: privacy@arabaty.app
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
        `,
      },
    });
  });

  // --- Report Routes ---

  app.post("/api/reports", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { targetId, targetType, reason, details } = req.body;
      // Basic validation
      if (!targetId || !targetType || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newReport] = await db
        .insert(reports)
        .values({
          userId: req.user!.id,
          targetId,
          targetType,
          reason,
          details,
        })
        .returning();
      res.json(newReport);
    } catch (error) {
      console.error("Report error:", error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get("/api/reports", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      // Join with users to get reporter details
      const result = await db
        .select({
          id: reports.id,
          targetId: reports.targetId,
          targetType: reports.targetType,
          reason: reports.reason,
          details: reports.details,
          status: reports.status,
          createdAt: reports.createdAt,
          reporterName: users.name,
          reporterPhone: users.phone,
        })
        .from(reports)
        .leftJoin(users, eq(reports.userId, users.id))
        .orderBy(desc(reports.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Fetch reports error:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.delete("/api/reports/:id", adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      await db.delete(reports).where(eq(reports.id, req.params.id));
      res.json({ message: "Report deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  return httpServer;
}
