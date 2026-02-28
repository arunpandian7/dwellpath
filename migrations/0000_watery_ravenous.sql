CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"lat" numeric,
	"lng" numeric
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"rent" integer NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric,
	"area_sqft" integer,
	"type" text,
	"status" text DEFAULT 'shortlisted',
	"notes" text,
	"link" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"name" text NOT NULL,
	"role" text,
	"phone" text,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "property_distances" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"location_id" integer,
	"distance_miles" numeric,
	"commute_time_mins" integer,
	"commute_mode" text DEFAULT 'driving'
);
--> statement-breakpoint
CREATE TABLE "property_follow_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"task" text NOT NULL,
	"due_date" timestamp,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "property_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"scheduled_at" timestamp NOT NULL,
	"notes" text,
	"rating" integer
);
--> statement-breakpoint
ALTER TABLE "property_contacts" ADD CONSTRAINT "property_contacts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_distances" ADD CONSTRAINT "property_distances_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_distances" ADD CONSTRAINT "property_distances_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_follow_ups" ADD CONSTRAINT "property_follow_ups_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_visits" ADD CONSTRAINT "property_visits_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;