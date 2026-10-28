CREATE TABLE "ai4i_telemetry_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"udi" integer NOT NULL,
	"product_id" varchar(32) NOT NULL,
	"type" varchar(2) NOT NULL,
	"air_temperature_k" double precision NOT NULL,
	"process_temperature_k" double precision NOT NULL,
	"rotational_speed_rpm" integer NOT NULL,
	"torque_nm" double precision NOT NULL,
	"tool_wear_min" integer NOT NULL,
	"machine_failure" boolean NOT NULL,
	"twf" boolean NOT NULL,
	"hdf" boolean NOT NULL,
	"pwf" boolean NOT NULL,
	"osf" boolean NOT NULL,
	"rnf" boolean NOT NULL,
	"data_origin" "data_origin" DEFAULT 'operational_telemetry' NOT NULL,
	"is_fixture_seed" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_file" varchar(255) NOT NULL,
	"source_dataset" varchar(64) DEFAULT 'ai4i_2020' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai4i_records_udi_unique_idx" ON "ai4i_telemetry_records" USING btree ("udi");--> statement-breakpoint
CREATE INDEX "ai4i_records_product_id_idx" ON "ai4i_telemetry_records" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "ai4i_records_type_idx" ON "ai4i_telemetry_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai4i_records_machine_failure_idx" ON "ai4i_telemetry_records" USING btree ("machine_failure");--> statement-breakpoint
CREATE INDEX "ai4i_records_imported_at_idx" ON "ai4i_telemetry_records" USING btree ("imported_at");