CREATE TYPE "public"."data_origin" AS ENUM('development_fixture', 'rule_evaluated', 'operational_telemetry');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_finding_status" AS ENUM('open', 'under_review', 'action_planned', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_review_state" AS ENUM('requires_review', 'in_review', 'verified_baseline');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_severity" AS ENUM('informational', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('nominal', 'warning', 'critical', 'info');--> statement-breakpoint
CREATE TYPE "public"."fleet_maintenance_status" AS ENUM('up_to_date', 'scheduled', 'in_progress', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."fleet_operating_status" AS ENUM('operational', 'warning', 'critical', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('pending_review', 'approved_local', 'scheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."rotor_configuration" AS ENUM('turbine', 'spindle', 'compressor', 'pump', 'press');--> statement-breakpoint
CREATE TYPE "public"."sensor_metric_key" AS ENUM('vibration', 'temperature', 'rpm', 'acoustic');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('nominal', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."time_range_window" AS ENUM('1H', '6H', '24H', '7D');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('in_progress', 'scheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."work_order_type" AS ENUM('Predictive', 'Corrective', 'Calibration', 'Inspection');--> statement-breakpoint
CREATE TABLE "alerts" (
	"alert_id" varchar(64) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"sector" varchar(120) NOT NULL,
	"channel_code" varchar(96),
	"severity" "severity_level" NOT NULL,
	"title" varchar(240) NOT NULL,
	"fault_signature" varchar(240) NOT NULL,
	"telemetry_reading" varchar(160) NOT NULL,
	"threshold_limit" varchar(160) NOT NULL,
	"ai_confidence_percent" double precision,
	"estimated_rul_hours" integer,
	"detected_relative" varchar(64) NOT NULL,
	"detected_utc" varchar(64) NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recommended_action" text NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"fixture_note" text DEFAULT 'Illustrative development fixture record — not a live operational alert.' NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_kpi_metrics" (
	"metric_id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"value" varchar(64) NOT NULL,
	"unit" varchar(32),
	"delta_text" varchar(120) NOT NULL,
	"delta_tone" varchar(32) NOT NULL,
	"threshold_text" varchar(120) NOT NULL,
	"status" "severity_level" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_findings" (
	"finding_id" varchar(64) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"affected_component" varchar(200) NOT NULL,
	"component_code" varchar(64) NOT NULL,
	"title" varchar(240) NOT NULL,
	"severity" "diagnostic_severity" NOT NULL,
	"status" "diagnostic_finding_status" DEFAULT 'open' NOT NULL,
	"supporting_evidence" jsonb NOT NULL,
	"sensor_readings_summary" varchar(200) NOT NULL,
	"threshold_reference" varchar(200) NOT NULL,
	"recommended_next_action" text,
	"last_updated_utc" varchar(64) NOT NULL,
	"last_updated_relative" varchar(64) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fixture_disclaimer" text DEFAULT 'Illustrative frontend fixture record — not a live AI or verified engineering diagnosis.' NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_events" (
	"event_id" varchar(64) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"event_scope" varchar(32) NOT NULL,
	"category" varchar(64) NOT NULL,
	"severity" "event_severity" DEFAULT 'info' NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"timestamp_utc" varchar(64) NOT NULL,
	"relative_time" varchar(64) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_sub_assemblies" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"sub_assembly_key" varchar(64) NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" "severity_level" DEFAULT 'nominal' NOT NULL,
	"temperature_c" double precision NOT NULL,
	"vibration_rms" double precision NOT NULL,
	"material_spec" varchar(200) NOT NULL,
	"notes" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"machine_id" varchar(64) PRIMARY KEY NOT NULL,
	"plant_code" varchar(64) NOT NULL,
	"machine_name" varchar(160) NOT NULL,
	"machine_type" varchar(160) NOT NULL,
	"subsystem" varchar(128) DEFAULT 'Rotating Machinery' NOT NULL,
	"rotor_configuration" "rotor_configuration" DEFAULT 'turbine' NOT NULL,
	"location_zone" varchar(160) NOT NULL,
	"operating_status" "fleet_operating_status" DEFAULT 'operational' NOT NULL,
	"severity_status" "severity_level" DEFAULT 'nominal' NOT NULL,
	"health_score" double precision NOT NULL,
	"temperature_c" double precision NOT NULL,
	"temp_threshold_warning" double precision NOT NULL,
	"temp_threshold_critical" double precision NOT NULL,
	"vibration_rms" double precision NOT NULL,
	"vib_threshold_warning" double precision NOT NULL,
	"vib_threshold_critical" double precision NOT NULL,
	"rpm" integer NOT NULL,
	"rpm_nominal" integer NOT NULL,
	"rpm_min_band" integer DEFAULT 0 NOT NULL,
	"rpm_max_band" integer DEFAULT 20000 NOT NULL,
	"acoustic_db" double precision DEFAULT 70 NOT NULL,
	"acoustic_threshold_warning" double precision DEFAULT 82 NOT NULL,
	"acoustic_threshold_critical" double precision DEFAULT 90 NOT NULL,
	"operating_hours" integer DEFAULT 10000 NOT NULL,
	"rul_hours" integer NOT NULL,
	"needs_attention" boolean DEFAULT false NOT NULL,
	"active_fault_signature" text,
	"maintenance_status" "fleet_maintenance_status" DEFAULT 'up_to_date' NOT NULL,
	"maintenance_label" varchar(160) NOT NULL,
	"next_maintenance_window" varchar(160) NOT NULL,
	"assigned_team" varchar(160),
	"lead_technician" varchar(120),
	"work_order_id" varchar(64),
	"diagnostic_review_status" "diagnostic_review_state" DEFAULT 'verified_baseline' NOT NULL,
	"diagnostic_review_label" varchar(160) DEFAULT 'Baseline Verified' NOT NULL,
	"sensor_channels_count" integer DEFAULT 8 NOT NULL,
	"gateway_node" varchar(64) NOT NULL,
	"last_update_relative" varchar(64) NOT NULL,
	"last_update_utc" varchar(64) NOT NULL,
	"last_telemetry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_recommendations" (
	"recommendation_id" varchar(64) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"associated_component" varchar(200) NOT NULL,
	"action_title" varchar(240) NOT NULL,
	"priority" varchar(64) NOT NULL,
	"supporting_reason" text NOT NULL,
	"suggested_status" "recommendation_status" DEFAULT 'pending_review' NOT NULL,
	"completion_status" varchar(200) NOT NULL,
	"estimated_window" varchar(160) NOT NULL,
	"linked_finding_id" varchar(64),
	"work_order_ref" varchar(64),
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_work_orders" (
	"work_order_id" varchar(64) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"task_title" varchar(240) NOT NULL,
	"maintenance_type" "work_order_type" NOT NULL,
	"assigned_team" varchar(160) NOT NULL,
	"lead_engineer" varchar(120) NOT NULL,
	"scheduled_window" varchar(160) NOT NULL,
	"estimated_duration" varchar(64) NOT NULL,
	"status" "work_order_status" DEFAULT 'scheduled' NOT NULL,
	"priority" varchar(64) NOT NULL,
	"trigger_alert_id" varchar(64),
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensor_channels" (
	"channel_id" varchar(96) PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"metric_key" "sensor_metric_key" NOT NULL,
	"label" varchar(160) NOT NULL,
	"channel_code" varchar(64) NOT NULL,
	"current_reading" double precision NOT NULL,
	"unit" varchar(32) NOT NULL,
	"status" "severity_level" DEFAULT 'nominal' NOT NULL,
	"normal_range_text" varchar(120) NOT NULL,
	"warning_threshold" double precision,
	"critical_threshold" double precision,
	"nominal_reference" double precision,
	"threshold_exceeded" boolean DEFAULT false NOT NULL,
	"exceeded_summary" text,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"plant_code" varchar(64) PRIMARY KEY NOT NULL,
	"plant_name" varchar(160) NOT NULL,
	"primary_sector_code" varchar(64) NOT NULL,
	"gateway_node" varchar(64) NOT NULL,
	"gateway_sync_percent" double precision DEFAULT 99.98 NOT NULL,
	"status_label" varchar(64) DEFAULT 'SYSTEM NOMINAL' NOT NULL,
	"uptime_percent" double precision DEFAULT 98.4 NOT NULL,
	"sampling_rate_hz" integer DEFAULT 25600 NOT NULL,
	"active_model_build" varchar(128) NOT NULL,
	"last_sync_display_utc" varchar(64) NOT NULL,
	"last_sync_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subsystem_health_rollups" (
	"subsystem_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"asset_count" integer NOT NULL,
	"health_percent" double precision NOT NULL,
	"mean_rul_hours" integer NOT NULL,
	"status" "severity_level" NOT NULL,
	"primary_metric_label" varchar(96) NOT NULL,
	"primary_metric_value" varchar(64) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" varchar(64) NOT NULL,
	"time_range" time_range_window NOT NULL,
	"sample_index" integer NOT NULL,
	"timestamp_label" varchar(64) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"temperature_c" double precision NOT NULL,
	"vibration_rms" double precision NOT NULL,
	"rpm" integer NOT NULL,
	"acoustic_db" double precision NOT NULL,
	"anomaly_probability" double precision,
	"is_forecast" boolean DEFAULT false NOT NULL,
	"data_origin" "data_origin" DEFAULT 'development_fixture' NOT NULL,
	"is_fixture_seed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_findings" ADD CONSTRAINT "diagnostic_findings_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_events" ADD CONSTRAINT "machine_events_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_sub_assemblies" ADD CONSTRAINT "machine_sub_assemblies_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_plant_code_sites_plant_code_fk" FOREIGN KEY ("plant_code") REFERENCES "public"."sites"("plant_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_recommendations" ADD CONSTRAINT "maintenance_recommendations_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_recommendations" ADD CONSTRAINT "maintenance_recommendations_linked_finding_id_diagnostic_findings_finding_id_fk" FOREIGN KEY ("linked_finding_id") REFERENCES "public"."diagnostic_findings"("finding_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_channels" ADD CONSTRAINT "sensor_channels_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_readings" ADD CONSTRAINT "telemetry_readings_machine_id_machines_machine_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("machine_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_machine_severity_idx" ON "alerts" USING btree ("machine_id","severity");--> statement-breakpoint
CREATE INDEX "alerts_detected_at_idx" ON "alerts" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "diagnostic_findings_machine_sev_status_idx" ON "diagnostic_findings" USING btree ("machine_id","severity","status");--> statement-breakpoint
CREATE INDEX "machine_events_machine_scope_idx" ON "machine_events" USING btree ("machine_id","event_scope");--> statement-breakpoint
CREATE INDEX "machine_events_occurred_at_idx" ON "machine_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "machine_sub_assembly_unique_idx" ON "machine_sub_assemblies" USING btree ("machine_id","sub_assembly_key");--> statement-breakpoint
CREATE INDEX "machine_sub_assemblies_machine_idx" ON "machine_sub_assemblies" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "machines_plant_status_idx" ON "machines" USING btree ("plant_code","operating_status");--> statement-breakpoint
CREATE INDEX "machines_health_score_idx" ON "machines" USING btree ("health_score");--> statement-breakpoint
CREATE INDEX "machines_needs_attention_idx" ON "machines" USING btree ("needs_attention");--> statement-breakpoint
CREATE INDEX "maintenance_recommendations_machine_status_idx" ON "maintenance_recommendations" USING btree ("machine_id","suggested_status");--> statement-breakpoint
CREATE INDEX "work_orders_machine_status_idx" ON "maintenance_work_orders" USING btree ("machine_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sensor_channels_machine_metric_unique_idx" ON "sensor_channels" USING btree ("machine_id","metric_key");--> statement-breakpoint
CREATE INDEX "sensor_channels_machine_idx" ON "sensor_channels" USING btree ("machine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telemetry_readings_machine_range_sample_unique_idx" ON "telemetry_readings" USING btree ("machine_id","time_range","sample_index");--> statement-breakpoint
CREATE INDEX "telemetry_readings_machine_range_idx" ON "telemetry_readings" USING btree ("machine_id","time_range");--> statement-breakpoint
CREATE INDEX "telemetry_readings_recorded_at_idx" ON "telemetry_readings" USING btree ("recorded_at");