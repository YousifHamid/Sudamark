import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name").notNull(),
  roles: jsonb("roles").$type<string[]>().notNull().default(sql`'["buyer"]'::jsonb`),
  countryCode: text("country_code").default("+249"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const magicTokens = pgTable("magic_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cars = pgTable("cars", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  mileage: integer("mileage"),
  fuelType: text("fuel_type"),
  transmission: text("transmission"),
  color: text("color"),
  city: text("city").notNull(),
  description: text("description"),
  images: jsonb("images").$type<string[]>().default(sql`'[]'::jsonb`),
  category: text("category").default("sedan"),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceProviders = pgTable("service_providers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  city: text("city").notNull(),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  description: text("description"),
  services: jsonb("services").$type<string[]>().default(sql`'[]'::jsonb`),
  price: text("price"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buyerOffers = pgTable("buyer_offers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  carId: varchar("car_id").references(() => cars.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  offerPrice: integer("offer_price").notNull(),
  message: text("message"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspectionRequests = pgTable("inspection_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  carId: varchar("car_id").references(() => cars.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  sellerId: varchar("seller_id").references(() => users.id).notNull(),
  status: text("status").default("pending"),
  message: text("message"),
  sellerResponse: text("seller_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  carId: varchar("car_id").references(() => cars.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sliderImages = pgTable("slider_images", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  linkUrl: text("link_url"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  carId: varchar("car_id").references(() => cars.id),
  trxNo: text("trx_no").notNull(),
  amount: integer("amount").notNull(),
  paidAt: text("paid_at").notNull(),
  status: text("status").default("pending"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarSchema = createInsertSchema(cars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSliderImageSchema = createInsertSchema(sliderImages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof cars.$inferSelect;

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertSliderImage = z.infer<typeof insertSliderImageSchema>;
export type SliderImage = typeof sliderImages.$inferSelect;

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;

export const insertMagicTokenSchema = createInsertSchema(magicTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertMagicToken = z.infer<typeof insertMagicTokenSchema>;
export type MagicToken = typeof magicTokens.$inferSelect;

export const insertBuyerOfferSchema = createInsertSchema(buyerOffers).omit({
  id: true,
  createdAt: true,
});

export const insertInspectionRequestSchema = createInsertSchema(inspectionRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBuyerOffer = z.infer<typeof insertBuyerOfferSchema>;
export type BuyerOffer = typeof buyerOffers.$inferSelect;

export type InsertInspectionRequest = z.infer<typeof insertInspectionRequestSchema>;
export type InspectionRequest = typeof inspectionRequests.$inferSelect;

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
