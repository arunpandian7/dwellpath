import { z } from 'zod';
import { 
  insertLocationSchema, 
  insertPropertySchema,
  insertPropertyContactSchema,
  insertPropertyDistanceSchema,
  insertPropertyVisitSchema,
  insertPropertyFollowUpSchema,
  properties,
  locations,
  propertyContacts,
  propertyDistances,
  propertyVisits,
  propertyFollowUps
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// We define a nested schema for returning a full property with its relations
const propertyWithDetailsSchema = z.custom<typeof properties.$inferSelect & {
  contacts: typeof propertyContacts.$inferSelect[];
  distances: (typeof propertyDistances.$inferSelect & { location: typeof locations.$inferSelect })[];
  visits: typeof propertyVisits.$inferSelect[];
  followUps: typeof propertyFollowUps.$inferSelect[];
}>();

export const api = {
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations' as const,
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/locations' as const,
      input: insertLocationSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/locations/:id' as const,
      input: insertLocationSchema.partial(),
      responses: {
        200: z.custom<typeof locations.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/locations/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties' as const,
      responses: {
        200: z.array(z.custom<typeof properties.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id' as const,
      responses: {
        200: propertyWithDetailsSchema,
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties' as const,
      input: insertPropertySchema,
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/properties/:id' as const,
      input: insertPropertySchema.partial(),
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/properties/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    scrape: {
      method: 'POST' as const,
      path: '/api/properties/scrape' as const,
      input: z.object({ url: z.string().url() }),
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
        500: z.object({ message: z.string() }),
      }
    }
  },
  contacts: {
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/contacts' as const,
      input: insertPropertyContactSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof propertyContacts.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contacts/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  distances: {
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/distances' as const,
      input: insertPropertyDistanceSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof propertyDistances.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/distances/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  visits: {
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/visits' as const,
      input: insertPropertyVisitSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof propertyVisits.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/visits/:id' as const,
      input: insertPropertyVisitSchema.partial(),
      responses: {
        200: z.custom<typeof propertyVisits.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/visits/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  followUps: {
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/follow-ups' as const,
      input: insertPropertyFollowUpSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof propertyFollowUps.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/follow-ups/:id' as const,
      input: insertPropertyFollowUpSchema.partial(),
      responses: {
        200: z.custom<typeof propertyFollowUps.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/follow-ups/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}