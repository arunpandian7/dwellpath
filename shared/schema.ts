import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Office", "Kids School"
  address: text("address").notNull(),
  lat: numeric("lat"), // Stored as string for precision, or could be decimal
  lng: numeric("lng"),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  rent: integer("rent").notNull(), // Monthly rent
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms"),
  areaSqft: integer("area_sqft"),
  type: text("type"), // Apartment, House, Condo
  status: text("status").default('shortlisted'), // shortlisted, visited, offered, rejected
  notes: text("notes"),
  link: text("link"), // Zillow, Redfin link
  imageUrl: text("image_url"), // Optional hero image
  createdAt: timestamp("created_at").defaultNow(),
});

export const propertyContacts = pgTable("property_contacts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  role: text("role"), // Landlord, Agent, Property Manager
  phone: text("phone"),
  email: text("email"),
});

export const propertyDistances = pgTable("property_distances", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  locationId: integer("location_id").references(() => locations.id, { onDelete: 'cascade' }),
  distanceMiles: numeric("distance_miles"),
  commuteTimeMins: integer("commute_time_mins"),
  commuteMode: text("commute_mode").default('driving'), // driving, transit, walking
});

export const propertyVisits = pgTable("property_visits", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  notes: text("notes"), // Pre/post visit notes
  rating: integer("rating"), // 1-5 stars
});

export const propertyFollowUps = pgTable("property_follow_ups", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }),
  task: text("task").notNull(), // e.g., "Email application", "Ask about pets"
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
});

// Zod schemas for inserting
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertPropertyContactSchema = createInsertSchema(propertyContacts).omit({ id: true });
export const insertPropertyDistanceSchema = createInsertSchema(propertyDistances).omit({ id: true });
export const insertPropertyVisitSchema = createInsertSchema(propertyVisits).omit({ id: true });
export const insertPropertyFollowUpSchema = createInsertSchema(propertyFollowUps).omit({ id: true });

// Select types
export type Location = typeof locations.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyContact = typeof propertyContacts.$inferSelect;
export type PropertyDistance = typeof propertyDistances.$inferSelect;
export type PropertyVisit = typeof propertyVisits.$inferSelect;
export type PropertyFollowUp = typeof propertyFollowUps.$inferSelect;

// Request types
export type CreateLocationRequest = z.infer<typeof insertLocationSchema>;
export type UpdateLocationRequest = Partial<CreateLocationRequest>;

export type CreatePropertyRequest = z.infer<typeof insertPropertySchema>;
export type UpdatePropertyRequest = Partial<CreatePropertyRequest>;

export type CreatePropertyContactRequest = z.infer<typeof insertPropertyContactSchema>;
export type UpdatePropertyContactRequest = Partial<CreatePropertyContactRequest>;

export type CreatePropertyDistanceRequest = z.infer<typeof insertPropertyDistanceSchema>;
export type UpdatePropertyDistanceRequest = Partial<CreatePropertyDistanceRequest>;

export type CreatePropertyVisitRequest = z.infer<typeof insertPropertyVisitSchema>;
export type UpdatePropertyVisitRequest = Partial<CreatePropertyVisitRequest>;

export type CreatePropertyFollowUpRequest = z.infer<typeof insertPropertyFollowUpSchema>;
export type UpdatePropertyFollowUpRequest = Partial<CreatePropertyFollowUpRequest>;

// Combined Property Response (useful for the frontend)
export interface PropertyWithDetails extends Property {
  contacts: PropertyContact[];
  distances: (PropertyDistance & { location: Location })[];
  visits: PropertyVisit[];
  followUps: PropertyFollowUp[];
}