import { db } from "./db";
import { 
  locations, properties, propertyContacts, propertyDistances, propertyVisits, propertyFollowUps,
  type CreateLocationRequest, type UpdateLocationRequest, type Location,
  type CreatePropertyRequest, type UpdatePropertyRequest, type Property, type PropertyWithDetails,
  type CreatePropertyContactRequest, type PropertyContact,
  type CreatePropertyDistanceRequest, type PropertyDistance,
  type CreatePropertyVisitRequest, type UpdatePropertyVisitRequest, type PropertyVisit,
  type CreatePropertyFollowUpRequest, type UpdatePropertyFollowUpRequest, type PropertyFollowUp
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  createLocation(location: CreateLocationRequest): Promise<Location>;
  updateLocation(id: number, updates: UpdateLocationRequest): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<void>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<PropertyWithDetails | undefined>;
  createProperty(property: CreatePropertyRequest): Promise<Property>;
  updateProperty(id: number, updates: UpdatePropertyRequest): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;

  // Contacts
  createContact(contact: CreatePropertyContactRequest): Promise<PropertyContact>;
  deleteContact(id: number): Promise<void>;

  // Distances
  createDistance(distance: CreatePropertyDistanceRequest): Promise<PropertyDistance>;
  deleteDistance(id: number): Promise<void>;

  // Visits
  createVisit(visit: CreatePropertyVisitRequest): Promise<PropertyVisit>;
  updateVisit(id: number, updates: UpdatePropertyVisitRequest): Promise<PropertyVisit | undefined>;
  deleteVisit(id: number): Promise<void>;

  // Follow-ups
  createFollowUp(followUp: CreatePropertyFollowUpRequest): Promise<PropertyFollowUp>;
  updateFollowUp(id: number, updates: UpdatePropertyFollowUpRequest): Promise<PropertyFollowUp | undefined>;
  deleteFollowUp(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // --- Locations ---
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(location: CreateLocationRequest): Promise<Location> {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }

  async updateLocation(id: number, updates: UpdateLocationRequest): Promise<Location | undefined> {
    const [updated] = await db.update(locations)
      .set(updates)
      .where(eq(locations.id, id))
      .returning();
    return updated;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // --- Properties ---
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: number): Promise<PropertyWithDetails | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    if (!property) return undefined;

    const contacts = await db.select().from(propertyContacts).where(eq(propertyContacts.propertyId, id));
    
    // Distances with joined location info
    const distancesData = await db.select()
      .from(propertyDistances)
      .leftJoin(locations, eq(propertyDistances.locationId, locations.id))
      .where(eq(propertyDistances.propertyId, id));
      
    const distances = distancesData
      .filter(d => d.locations !== null)
      .map(d => ({
        ...d.property_distances,
        location: d.locations as Location
      }));

    const visits = await db.select().from(propertyVisits).where(eq(propertyVisits.propertyId, id));
    const followUps = await db.select().from(propertyFollowUps).where(eq(propertyFollowUps.propertyId, id));

    return {
      ...property,
      contacts,
      distances,
      visits,
      followUps
    };
  }

  async createProperty(property: CreatePropertyRequest): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: number, updates: UpdatePropertyRequest): Promise<Property | undefined> {
    const [updated] = await db.update(properties)
      .set(updates)
      .where(eq(properties.id, id))
      .returning();
    return updated;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // --- Contacts ---
  async createContact(contact: CreatePropertyContactRequest): Promise<PropertyContact> {
    const [created] = await db.insert(propertyContacts).values(contact).returning();
    return created;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(propertyContacts).where(eq(propertyContacts.id, id));
  }

  // --- Distances ---
  async createDistance(distance: CreatePropertyDistanceRequest): Promise<PropertyDistance> {
    const [created] = await db.insert(propertyDistances).values(distance).returning();
    return created;
  }

  async deleteDistance(id: number): Promise<void> {
    await db.delete(propertyDistances).where(eq(propertyDistances.id, id));
  }

  // --- Visits ---
  async createVisit(visit: CreatePropertyVisitRequest): Promise<PropertyVisit> {
    const [created] = await db.insert(propertyVisits).values(visit).returning();
    return created;
  }

  async updateVisit(id: number, updates: UpdatePropertyVisitRequest): Promise<PropertyVisit | undefined> {
    const [updated] = await db.update(propertyVisits)
      .set(updates)
      .where(eq(propertyVisits.id, id))
      .returning();
    return updated;
  }

  async deleteVisit(id: number): Promise<void> {
    await db.delete(propertyVisits).where(eq(propertyVisits.id, id));
  }

  // --- Follow Ups ---
  async createFollowUp(followUp: CreatePropertyFollowUpRequest): Promise<PropertyFollowUp> {
    const [created] = await db.insert(propertyFollowUps).values(followUp).returning();
    return created;
  }

  async updateFollowUp(id: number, updates: UpdatePropertyFollowUpRequest): Promise<PropertyFollowUp | undefined> {
    const [updated] = await db.update(propertyFollowUps)
      .set(updates)
      .where(eq(propertyFollowUps.id, id))
      .returning();
    return updated;
  }

  async deleteFollowUp(id: number): Promise<void> {
    await db.delete(propertyFollowUps).where(eq(propertyFollowUps.id, id));
  }
}

export const storage = new DatabaseStorage();
