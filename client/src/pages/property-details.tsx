import { useProperty, useUpdateProperty, useCreateContact, useDeleteContact, useCreateDistance, useDeleteDistance, useLocations, useCreateVisit, useUpdateVisit, useCreateFollowUp, useUpdateFollowUp, useDeleteFollowUp } from "@/hooks/use-house-data";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { useRoute } from "wouter";
import { ChevronLeft, MapPin, User, Phone, Mail, Clock, Calendar, CheckSquare, Trash2, Edit, Plus, ExternalLink, Star } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertyContactSchema, insertPropertyDistanceSchema, insertPropertyVisitSchema, insertPropertyFollowUpSchema } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

export default function PropertyDetails() {
  const [match, params] = useRoute("/properties/:id");
  const id = Number(params?.id);
  const { data: property, isLoading } = useProperty(id);
  const { mutate: updateProperty } = useUpdateProperty();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!property) return <div className="flex h-screen items-center justify-center">Property not found</div>;

  const handleStatusChange = (newStatus: string) => {
    updateProperty({ id, status: newStatus });
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Properties
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-foreground">{property.address}</h1>
                <StatusBadge status={property.status || 'shortlisted'} />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="text-2xl font-bold text-primary font-display">
                  ${property.rent.toLocaleString()}<span className="text-sm font-sans font-medium text-muted-foreground">/mo</span>
                </span>
                <span className="w-px h-6 bg-border" />
                <span>{property.bedrooms} Bed</span>
                <span>{property.bathrooms} Bath</span>
                {property.areaSqft && <span>{property.areaSqft} sqft</span>}
              </div>
            </div>

            <div className="flex gap-3">
              <Select defaultValue={property.status || 'shortlisted'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="offered">Offer Made</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {property.link && (
                <Button variant="outline" asChild>
                  <a href={property.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View Listing
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="commute">Commute</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="tasks">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Details & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Property Type</span>
                      <p className="font-medium mt-1">{property.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Added</span>
                      <p className="font-medium mt-1">{property.createdAt ? format(new Date(property.createdAt), "MMM d, yyyy") : "-"}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-2">Notes</span>
                    <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                      {property.notes || "No notes added yet."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {property.imageUrl && (
                <Card className="overflow-hidden">
                  <img src={property.imageUrl} alt="Property" className="w-full h-full object-cover min-h-[200px]" />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsSection propertyId={id} contacts={property.contacts} />
          </TabsContent>

          <TabsContent value="commute">
            <CommuteSection propertyId={id} distances={property.distances} />
          </TabsContent>

          <TabsContent value="visits">
            <VisitsSection propertyId={id} visits={property.visits} />
          </TabsContent>

          <TabsContent value="tasks">
            <FollowUpsSection propertyId={id} followUps={property.followUps} />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

// --- SUB-COMPONENTS ---

function ContactsSection({ propertyId, contacts }: { propertyId: number, contacts: any[] }) {
  const { mutate, isPending } = useCreateContact();
  const { mutate: deleteContact } = useDeleteContact();
  const [open, setOpen] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(insertPropertyContactSchema.omit({ propertyId: true })),
    defaultValues: { name: "", role: "", phone: "", email: "" }
  });

  const onSubmit = (data: any) => {
    mutate({ propertyId, ...data }, {
      onSuccess: () => { setOpen(false); form.reset(); }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Key Contacts</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="Agent, Landlord..." {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isPending}>Save Contact</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No contacts listed.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-start justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <div className="font-semibold flex items-center gap-2">
                    {contact.name}
                    {contact.role && <Badge variant="secondary" className="text-xs">{contact.role}</Badge>}
                  </div>
                  {contact.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 mr-2" /> {contact.phone}
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 mr-2" /> {contact.email}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteContact({ id: contact.id, propertyId })} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommuteSection({ propertyId, distances }: { propertyId: number, distances: any[] }) {
  const { data: locations } = useLocations();
  const { mutate, isPending } = useCreateDistance();
  const { mutate: deleteDistance } = useDeleteDistance();
  const [open, setOpen] = useState(false);

  // Filter out locations already added
  const availableLocations = locations?.filter(
    loc => !distances.some(d => d.locationId === loc.id)
  ) || [];

  const form = useForm({
    resolver: zodResolver(insertPropertyDistanceSchema.omit({ propertyId: true }).extend({
      locationId: z.coerce.number(),
      distanceMiles: z.coerce.string(), // Input returns string
      commuteTimeMins: z.coerce.number()
    })),
    defaultValues: { locationId: 0, distanceMiles: "", commuteTimeMins: 0, commuteMode: "driving" }
  });

  const onSubmit = (data: any) => {
    mutate({ propertyId, ...data }, {
      onSuccess: () => { setOpen(false); form.reset(); }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Commute Times</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Commute</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Commute Info</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="locationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableLocations.map(loc => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="distanceMiles" render={({ field }) => (
                    <FormItem><FormLabel>Miles</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="commuteTimeMins" render={({ field }) => (
                    <FormItem><FormLabel>Minutes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="commuteMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue="driving">
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="driving">Driving</SelectItem>
                        <SelectItem value="transit">Public Transit</SelectItem>
                        <SelectItem value="walking">Walking</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isPending}>Save</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distances.map((dist) => (
            <div key={dist.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{dist.location.name}</h4>
                  <p className="text-sm text-muted-foreground">{dist.location.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-lg">{dist.commuteTimeMins} min</p>
                  <p className="text-xs text-muted-foreground capitalize">{dist.commuteMode} • {dist.distanceMiles} mi</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDistance({ id: dist.id, propertyId })} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {distances.length === 0 && <p className="text-muted-foreground text-sm italic">No commutes added yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function VisitsSection({ propertyId, visits }: { propertyId: number, visits: any[] }) {
  const { mutate, isPending } = useCreateVisit();
  const { mutate: updateVisit } = useUpdateVisit();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPropertyVisitSchema.omit({ propertyId: true }).extend({
      scheduledAt: z.coerce.date(), // HTML date input returns string
    })),
    defaultValues: { scheduledAt: new Date(), notes: "", rating: 0 }
  });

  const onSubmit = (data: any) => {
    mutate({ propertyId, ...data }, {
      onSuccess: () => { setOpen(false); form.reset(); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scheduled Visits</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Schedule Visit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Visit</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="scheduledAt" render={({ field }) => (
                  <FormItem><FormLabel>Date & Time</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isPending}>Schedule</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {visits.map((visit) => (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-purple-50 rounded-lg flex flex-col items-center justify-center text-purple-700 border border-purple-100">
                    <span className="text-xs font-bold uppercase">{format(new Date(visit.scheduledAt), "MMM")}</span>
                    <span className="text-lg font-bold">{format(new Date(visit.scheduledAt), "d")}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{format(new Date(visit.scheduledAt), "h:mm a")}</h4>
                    <p className="text-sm text-muted-foreground">{visit.notes || "No notes"}</p>
                    {visit.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-amber-500">
                        {[...Array(visit.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                      </div>
                    )}
                  </div>
                </div>
                
                {!visit.rating && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button 
                        key={star} 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                        onClick={() => updateVisit({ id: visit.id, propertyId, rating: star })}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {visits.length === 0 && <p className="text-center text-muted-foreground py-8">No visits scheduled.</p>}
      </div>
    </div>
  );
}

function FollowUpsSection({ propertyId, followUps }: { propertyId: number, followUps: any[] }) {
  const { mutate, isPending } = useCreateFollowUp();
  const { mutate: updateFollowUp } = useUpdateFollowUp();
  const { mutate: deleteFollowUp } = useDeleteFollowUp();
  const [task, setTask] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    mutate({ propertyId, task, completed: false }, { onSuccess: () => setTask("") });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Tasks</CardTitle>
        <CardDescription>Keep track of questions to ask or documents to send.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <Input 
            placeholder="Add a new task..." 
            value={task} 
            onChange={e => setTask(e.target.value)} 
          />
          <Button type="submit" disabled={isPending || !task.trim()}>Add</Button>
        </form>

        <div className="space-y-2">
          {followUps.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.completed ? 'bg-muted/50 border-transparent' : 'bg-card'}`}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 rounded-md border ${item.completed ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 text-transparent hover:text-muted-foreground'}`}
                onClick={() => updateFollowUp({ id: item.id, propertyId, completed: !item.completed })}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.task}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => deleteFollowUp({ id: item.id, propertyId })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {followUps.length === 0 && <p className="text-muted-foreground text-sm italic text-center py-4">No tasks yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
