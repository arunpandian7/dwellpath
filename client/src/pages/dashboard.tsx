import { useQuery } from "@tanstack/react-query";
import { PropertyWithDetails, Property } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Clock, Home as HomeIcon, LayoutDashboard } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutShell } from "@/components/layout-shell";

export default function Dashboard() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch details for all properties to get visits and follow-ups
  const { data: allDetails, isLoading: isLoadingDetails } = useQuery<PropertyWithDetails[]>({
    queryKey: ["/api/properties/details"],
    queryFn: async () => {
      if (!properties) return [];
      const details = await Promise.all(
        properties.map(async (p) => {
          const res = await fetch(`/api/properties/${p.id}`);
          if (!res.ok) throw new Error("Failed to fetch property details");
          return res.json();
        })
      );
      return details;
    },
    enabled: !!properties,
  });

  if (isLoading || isLoadingDetails) {
    return (
      <LayoutShell>
        <div className="p-4 space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  const upcomingVisits = allDetails
    ?.flatMap((p) => p.visits.map((v) => ({ ...v, propertyAddress: p.address, propertyId: p.id })))
    .filter((v) => isAfter(parseISO(v.scheduledAt.toString()), new Date()))
    .sort((a, b) => parseISO(a.scheduledAt.toString()).getTime() - parseISO(b.scheduledAt.toString()).getTime()) || [];

  const pendingFollowUps = allDetails
    ?.flatMap((p) => p.followUps.map((f) => ({ ...f, propertyAddress: p.address, propertyId: p.id })))
    .filter((f) => !f.completed)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return parseISO(a.dueDate.toString()).getTime() - parseISO(b.dueDate.toString()).getTime();
    }) || [];

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your upcoming visits and pending follow-ups.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Visits */}
          <Card className="hover-elevate overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">Upcoming Visits</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVisits.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                    <p className="text-muted-foreground text-sm">No upcoming visits scheduled.</p>
                    <Link href="/properties">
                      <a className="text-primary hover:underline text-sm font-medium mt-2 inline-block">
                        Find properties to visit
                      </a>
                    </Link>
                  </div>
                ) : (
                  upcomingVisits.map((visit) => (
                    <Link key={visit.id} href={`/properties/${visit.propertyId}`}>
                      <a className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="font-bold group-hover:text-primary transition-colors line-clamp-1">
                              {visit.propertyAddress}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              {format(parseISO(visit.scheduledAt.toString()), "PPP p")}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Visit</Badge>
                        </div>
                      </a>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Follow Ups */}
          <Card className="hover-elevate overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">Pending Follow Ups</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFollowUps.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                    <p className="text-muted-foreground text-sm">All caught up! No pending tasks.</p>
                  </div>
                ) : (
                  pendingFollowUps.map((task) => (
                    <Link key={task.id} href={`/properties/${task.propertyId}`}>
                      <a className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="font-bold group-hover:text-primary transition-colors line-clamp-1">
                              {task.task}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Property: {task.propertyAddress}
                            </p>
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-destructive gap-1 mt-1 font-medium">
                                <Clock className="h-3 w-3" />
                                Due: {format(parseISO(task.dueDate.toString()), "MMM d")}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="border-orange-500/30 text-orange-500 bg-orange-500/5">
                            Task
                          </Badge>
                        </div>
                      </a>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
