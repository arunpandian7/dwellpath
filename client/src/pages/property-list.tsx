import { useProperties, useCreateProperty } from "@/hooks/use-house-data";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Bed, Bath, Home, ArrowRight, Loader2, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type CreatePropertyRequest } from "@shared/schema";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PropertyList() {
  const { data: properties, isLoading } = useProperties();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredProperties = properties?.filter(p => 
    p.address.toLowerCase().includes(search.toLowerCase()) ||
    p.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage and track your house hunting journey.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search address..." 
              className="pl-9 w-full md:w-64 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CreatePropertyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProperties?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/25">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No properties yet</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2 mb-6">
            Start by adding a property you're interested in tracking.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="lg">Add First Property</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties?.map((property, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              key={property.id}
            >
              <Link href={`/properties/${property.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                  <div className="h-48 bg-muted relative overflow-hidden">
                    {property.imageUrl ? (
                      <img 
                        src={property.imageUrl} 
                        alt={property.address} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Home className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={property.status || 'shortlisted'} />
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{property.address}</h3>
                      <p className="text-2xl font-display font-bold text-primary mt-2">
                        ${property.rent.toLocaleString()}<span className="text-sm font-sans font-medium text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms || '-'} Beds</span>
                      </div>
                      <div className="w-px h-4 bg-border" />
                      <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms || '-'} Baths</span>
                      </div>
                      <div className="ml-auto">
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </LayoutShell>
  );
}

function CreatePropertyDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateProperty();
  
  const form = useForm<CreatePropertyRequest>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      address: "",
      rent: 0,
      bedrooms: 1,
      bathrooms: "1",
      areaSqft: 0,
      type: "Apartment",
      status: "shortlisted",
      notes: "",
      link: "",
      imageUrl: "",
    }
  });

  const onSubmit = (data: CreatePropertyRequest) => {
    mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "Apartment"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} onChange={e => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="areaSqft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (sqft)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create Property"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
