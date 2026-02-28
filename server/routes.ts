import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { scrapeProperty } from "./scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==========================================
  // Locations
  // ==========================================
  app.get(api.locations.list.path, async (_req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.locations.update.path, async (req, res) => {
    try {
      const input = api.locations.update.input.parse(req.body);
      const location = await storage.updateLocation(Number(req.params.id), input);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.locations.delete.path, async (req, res) => {
    await storage.deleteLocation(Number(req.params.id));
    res.status(204).end();
  });

  // ==========================================
  // Properties
  // ==========================================
  app.get(api.properties.list.path, async (_req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.get(api.properties.get.path, async (req, res) => {
    const property = await storage.getProperty(Number(req.params.id));
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  });

  app.post(api.properties.create.path, async (req, res) => {
    try {
      // Coerce numeric fields from forms
      const schema = api.properties.create.input.extend({
        rent: z.coerce.number(),
        bedrooms: z.coerce.number().optional(),
        areaSqft: z.coerce.number().optional(),
      });
      const input = schema.parse(req.body);
      const property = await storage.createProperty(input);
      res.status(201).json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.properties.update.path, async (req, res) => {
    try {
      const schema = api.properties.update.input.extend({
        rent: z.coerce.number().optional(),
        bedrooms: z.coerce.number().optional(),
        areaSqft: z.coerce.number().optional(),
      });
      const input = schema.parse(req.body);
      const property = await storage.updateProperty(Number(req.params.id), input);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.properties.delete.path, async (req, res) => {
    await storage.deleteProperty(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.properties.scrape.path, async (req, res) => {
    try {
      const { url } = api.properties.scrape.input.parse(req.body);
      const scrapedData = await scrapeProperty(url);
      const property = await storage.createProperty(scrapedData);
      res.status(201).json(property);
    } catch (err: any) {
      console.error("Scraping error:", err?.message || err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: err?.message || "Failed to scrape property details" });
    }
  });

  // ==========================================
  // Property Contacts
  // ==========================================
  app.post(api.contacts.create.path, async (req, res) => {
    try {
      const input = api.contacts.create.input.parse(req.body);
      const contact = await storage.createContact({
        ...input,
        propertyId: Number(req.params.propertyId)
      });
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.contacts.delete.path, async (req, res) => {
    await storage.deleteContact(Number(req.params.id));
    res.status(204).end();
  });

  // ==========================================
  // Property Distances
  // ==========================================
  app.post(api.distances.create.path, async (req, res) => {
    try {
      const schema = api.distances.create.input.extend({
        locationId: z.coerce.number(),
        commuteTimeMins: z.coerce.number().optional()
      });
      const input = schema.parse(req.body);
      const distance = await storage.createDistance({
        ...input,
        propertyId: Number(req.params.propertyId)
      });
      res.status(201).json(distance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.distances.delete.path, async (req, res) => {
    await storage.deleteDistance(Number(req.params.id));
    res.status(204).end();
  });

  // ==========================================
  // Property Visits
  // ==========================================
  app.post(api.visits.create.path, async (req, res) => {
    try {
      const schema = api.visits.create.input.extend({
        scheduledAt: z.coerce.date(),
        rating: z.coerce.number().optional()
      });
      const input = schema.parse(req.body);
      const visit = await storage.createVisit({
        ...input,
        propertyId: Number(req.params.propertyId)
      });
      res.status(201).json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.visits.update.path, async (req, res) => {
    try {
      const schema = api.visits.update.input.extend({
        scheduledAt: z.coerce.date().optional(),
        rating: z.coerce.number().optional()
      });
      const input = schema.parse(req.body);
      const visit = await storage.updateVisit(Number(req.params.id), input);
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }
      res.json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.visits.delete.path, async (req, res) => {
    await storage.deleteVisit(Number(req.params.id));
    res.status(204).end();
  });

  // ==========================================
  // Property Follow-ups
  // ==========================================
  app.post(api.followUps.create.path, async (req, res) => {
    try {
      const schema = api.followUps.create.input.extend({
        dueDate: z.coerce.date().optional()
      });
      const input = schema.parse(req.body);
      const followUp = await storage.createFollowUp({
        ...input,
        propertyId: Number(req.params.propertyId)
      });
      res.status(201).json(followUp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.followUps.update.path, async (req, res) => {
    try {
      const schema = api.followUps.update.input.extend({
        dueDate: z.coerce.date().optional()
      });
      const input = schema.parse(req.body);
      const followUp = await storage.updateFollowUp(Number(req.params.id), input);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.followUps.delete.path, async (req, res) => {
    await storage.deleteFollowUp(Number(req.params.id));
    res.status(204).end();
  });

  // Run seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingLocations = await storage.getLocations();
  
  if (existingLocations.length === 0) {
    console.log("Seeding initial locations...");
    const office = await storage.createLocation({
      name: "Office",
      address: "123 Tech Blvd, San Francisco, CA",
    });
    
    const school = await storage.createLocation({
      name: "Kids Elementary",
      address: "456 Learning Way, San Francisco, CA",
    });

    console.log("Seeding initial properties...");
    const prop1 = await storage.createProperty({
      address: "789 Ocean View Dr, Apt 4B",
      rent: 3500,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1200,
      type: "Apartment",
      status: "shortlisted",
      notes: "Great view, but street parking only. Good natural light.",
      link: "https://example.com/property/1",
    });

    const prop2 = await storage.createProperty({
      address: "101 Suburbia Ln",
      rent: 4200,
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 1800,
      type: "House",
      status: "visited",
      notes: "Nice backyard, quiet neighborhood. Needs some minor updates.",
      link: "https://example.com/property/2",
    });
    
    console.log("Seeding related property data...");
    // Contacts
    await storage.createContact({
      propertyId: prop1.id,
      name: "Jane Smith",
      role: "Leasing Agent",
      phone: "555-0199",
      email: "jane@oceanview.com"
    });
    
    // Distances
    await storage.createDistance({
      propertyId: prop1.id,
      locationId: office.id,
      distanceMiles: "2.5",
      commuteTimeMins: 15,
      commuteMode: "driving"
    });
    
    await storage.createDistance({
      propertyId: prop2.id,
      locationId: school.id,
      distanceMiles: "1.2",
      commuteTimeMins: 5,
      commuteMode: "driving"
    });

    // Visits
    await storage.createVisit({
      propertyId: prop2.id,
      scheduledAt: new Date(Date.now() - 86400000), // Yesterday
      notes: "Spacious living room, bedrooms are a bit small.",
      rating: 4
    });

    // Follow-ups
    await storage.createFollowUp({
      propertyId: prop1.id,
      task: "Email Jane to ask about pet policy deposit",
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      completed: false
    });
    
    await storage.createFollowUp({
      propertyId: prop2.id,
      task: "Submit rental application",
      dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
      completed: false
    });
    
    console.log("Database seeded successfully.");
  }
}