import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
  type CreateLocationRequest,
  type UpdateLocationRequest,
  type CreatePropertyRequest,
  type UpdatePropertyRequest,
  type CreatePropertyContactRequest,
  type CreatePropertyDistanceRequest,
  type CreatePropertyVisitRequest,
  type UpdatePropertyVisitRequest,
  type CreatePropertyFollowUpRequest,
  type UpdatePropertyFollowUpRequest
} from "@shared/schema";

// --- LOCATIONS ---
export function useLocations() {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: async () => {
      const res = await fetch(api.locations.list.path);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLocationRequest) => {
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.locations.list.path] }),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.locations.delete.path, { id });
      const res = await fetch(url, { method: api.locations.delete.method });
      if (!res.ok) throw new Error("Failed to delete location");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.locations.list.path] }),
  });
}

// --- PROPERTIES ---
export function useProperties() {
  return useQuery({
    queryKey: [api.properties.list.path],
    queryFn: async () => {
      const res = await fetch(api.properties.list.path);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return api.properties.list.responses[200].parse(await res.json());
    },
  });
}

export function useProperty(id: number) {
  return useQuery({
    queryKey: [api.properties.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.properties.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch property details");
      return api.properties.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePropertyRequest) => {
      const res = await fetch(api.properties.create.path, {
        method: api.properties.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create property");
      return api.properties.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePropertyRequest & { id: number }) => {
      const url = buildUrl(api.properties.update.path, { id });
      const res = await fetch(url, {
        method: api.properties.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update property");
      return api.properties.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, data.id] });
    },
  });
}


export function useScrapeProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(api.properties.scrape.path, {
        method: api.properties.scrape.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to scrape property");
      }
      return api.properties.scrape.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.properties.delete.path, { id });
      const res = await fetch(url, { method: api.properties.delete.method });
      if (!res.ok) throw new Error("Failed to delete property");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

// --- SUB-RESOURCES (Contacts, Distances, Visits, Follow-ups) ---

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, ...data }: CreatePropertyContactRequest & { propertyId: number }) => {
      const url = buildUrl(api.contacts.create.path, { propertyId });
      const res = await fetch(url, {
        method: api.contacts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      return api.contacts.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number, propertyId: number }) => {
      const url = buildUrl(api.contacts.delete.path, { id });
      const res = await fetch(url, { method: api.contacts.delete.method });
      if (!res.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useCreateDistance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, ...data }: CreatePropertyDistanceRequest & { propertyId: number }) => {
      const url = buildUrl(api.distances.create.path, { propertyId });
      const res = await fetch(url, {
        method: api.distances.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add distance");
      return api.distances.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useDeleteDistance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number, propertyId: number }) => {
      const url = buildUrl(api.distances.delete.path, { id });
      const res = await fetch(url, { method: api.distances.delete.method });
      if (!res.ok) throw new Error("Failed to delete distance");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, ...data }: CreatePropertyVisitRequest & { propertyId: number }) => {
      const url = buildUrl(api.visits.create.path, { propertyId });
      const res = await fetch(url, {
        method: api.visits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add visit");
      return api.visits.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId, ...data }: UpdatePropertyVisitRequest & { id: number, propertyId: number }) => {
      const url = buildUrl(api.visits.update.path, { id });
      const res = await fetch(url, {
        method: api.visits.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update visit");
      return api.visits.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, ...data }: CreatePropertyFollowUpRequest & { propertyId: number }) => {
      const url = buildUrl(api.followUps.create.path, { propertyId });
      const res = await fetch(url, {
        method: api.followUps.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add follow-up");
      return api.followUps.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId, ...data }: UpdatePropertyFollowUpRequest & { id: number, propertyId: number }) => {
      const url = buildUrl(api.followUps.update.path, { id });
      const res = await fetch(url, {
        method: api.followUps.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update follow-up");
      return api.followUps.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}

export function useDeleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number, propertyId: number }) => {
      const url = buildUrl(api.followUps.delete.path, { id });
      const res = await fetch(url, { method: api.followUps.delete.method });
      if (!res.ok) throw new Error("Failed to delete follow-up");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, variables.propertyId] });
    },
  });
}
