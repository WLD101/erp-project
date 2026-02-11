drop extension if exists "pg_net";


  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "code" text not null,
    "name" text not null,
    "type" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."accounts" enable row level security;


  create table "public"."assets" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "location" text
      );



  create table "public"."defect_logs" (
    "id" uuid not null default gen_random_uuid(),
    "inspection_id" uuid,
    "defect_type" text not null,
    "severity_points" integer not null,
    "location_yards" numeric not null
      );



  create table "public"."job_cards" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "work_order_id" uuid,
    "loom_id" text not null,
    "shift_id" text not null,
    "operator_id" uuid,
    "planned_picks" integer not null,
    "actual_picks" integer default 0,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."locations" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null
      );



  create table "public"."loom_stoppages" (
    "id" uuid not null default gen_random_uuid(),
    "job_card_id" uuid,
    "start_time" timestamp with time zone default now(),
    "end_time" timestamp with time zone,
    "reason" text
      );



  create table "public"."material_requisitions" (
    "id" uuid not null default gen_random_uuid(),
    "job_card_id" uuid,
    "yarn_batch_id" text not null,
    "quantity_requested" numeric not null,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."purchase_orders" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "total_amount" numeric not null,
    "status" text default 'pending'::text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."quality_inspections" (
    "id" uuid not null default gen_random_uuid(),
    "stock_batch_id" uuid,
    "inspector_id" uuid,
    "inspected_yards" numeric not null,
    "fabric_width_inches" numeric not null,
    "total_points" integer default 0,
    "calculated_score" numeric,
    "grade" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."role_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "role_id" uuid,
    "module" text not null,
    "action" text not null
      );



  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text
      );



  create table "public"."stock_batches" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "sku" text not null,
    "quantity" numeric not null,
    "job_card_id" uuid,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "address" text,
    "ntn_strn" text,
    "industry_type" text,
    "logo_url" text default '/logo3.png'::text,
    "wizard_progress" integer default 0,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."user_roles" (
    "user_id" uuid not null,
    "role_id" uuid not null,
    "tenant_id" uuid
      );


CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX assets_pkey ON public.assets USING btree (id);

CREATE UNIQUE INDEX defect_logs_pkey ON public.defect_logs USING btree (id);

CREATE UNIQUE INDEX job_cards_pkey ON public.job_cards USING btree (id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX loom_stoppages_pkey ON public.loom_stoppages USING btree (id);

CREATE UNIQUE INDEX material_requisitions_pkey ON public.material_requisitions USING btree (id);

CREATE UNIQUE INDEX purchase_orders_pkey ON public.purchase_orders USING btree (id);

CREATE UNIQUE INDEX quality_inspections_pkey ON public.quality_inspections USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX stock_batches_pkey ON public.stock_batches USING btree (id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role_id);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."assets" add constraint "assets_pkey" PRIMARY KEY using index "assets_pkey";

alter table "public"."defect_logs" add constraint "defect_logs_pkey" PRIMARY KEY using index "defect_logs_pkey";

alter table "public"."job_cards" add constraint "job_cards_pkey" PRIMARY KEY using index "job_cards_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."loom_stoppages" add constraint "loom_stoppages_pkey" PRIMARY KEY using index "loom_stoppages_pkey";

alter table "public"."material_requisitions" add constraint "material_requisitions_pkey" PRIMARY KEY using index "material_requisitions_pkey";

alter table "public"."purchase_orders" add constraint "purchase_orders_pkey" PRIMARY KEY using index "purchase_orders_pkey";

alter table "public"."quality_inspections" add constraint "quality_inspections_pkey" PRIMARY KEY using index "quality_inspections_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."stock_batches" add constraint "stock_batches_pkey" PRIMARY KEY using index "stock_batches_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."accounts" add constraint "accounts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."accounts" validate constraint "accounts_tenant_id_fkey";

alter table "public"."accounts" add constraint "accounts_type_check" CHECK ((type = ANY (ARRAY['asset'::text, 'liability'::text, 'equity'::text, 'revenue'::text, 'expense'::text]))) not valid;

alter table "public"."accounts" validate constraint "accounts_type_check";

alter table "public"."assets" add constraint "assets_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."assets" validate constraint "assets_tenant_id_fkey";

alter table "public"."defect_logs" add constraint "defect_logs_inspection_id_fkey" FOREIGN KEY (inspection_id) REFERENCES public.quality_inspections(id) not valid;

alter table "public"."defect_logs" validate constraint "defect_logs_inspection_id_fkey";

alter table "public"."defect_logs" add constraint "defect_logs_severity_points_check" CHECK (((severity_points >= 1) AND (severity_points <= 4))) not valid;

alter table "public"."defect_logs" validate constraint "defect_logs_severity_points_check";

alter table "public"."job_cards" add constraint "job_cards_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."job_cards" validate constraint "job_cards_tenant_id_fkey";

alter table "public"."locations" add constraint "locations_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."locations" validate constraint "locations_tenant_id_fkey";

alter table "public"."loom_stoppages" add constraint "loom_stoppages_job_card_id_fkey" FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) not valid;

alter table "public"."loom_stoppages" validate constraint "loom_stoppages_job_card_id_fkey";

alter table "public"."material_requisitions" add constraint "material_requisitions_job_card_id_fkey" FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) not valid;

alter table "public"."material_requisitions" validate constraint "material_requisitions_job_card_id_fkey";

alter table "public"."purchase_orders" add constraint "purchase_orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."purchase_orders" validate constraint "purchase_orders_created_by_fkey";

alter table "public"."purchase_orders" add constraint "purchase_orders_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."purchase_orders" validate constraint "purchase_orders_tenant_id_fkey";

alter table "public"."quality_inspections" add constraint "quality_inspections_stock_batch_id_fkey" FOREIGN KEY (stock_batch_id) REFERENCES public.stock_batches(id) not valid;

alter table "public"."quality_inspections" validate constraint "quality_inspections_stock_batch_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_role_id_fkey";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."stock_batches" add constraint "stock_batches_job_card_id_fkey" FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) not valid;

alter table "public"."stock_batches" validate constraint "stock_batches_job_card_id_fkey";

alter table "public"."stock_batches" add constraint "stock_batches_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."stock_batches" validate constraint "stock_batches_tenant_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_tenant_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."assets" to "anon";

grant insert on table "public"."assets" to "anon";

grant references on table "public"."assets" to "anon";

grant select on table "public"."assets" to "anon";

grant trigger on table "public"."assets" to "anon";

grant truncate on table "public"."assets" to "anon";

grant update on table "public"."assets" to "anon";

grant delete on table "public"."assets" to "authenticated";

grant insert on table "public"."assets" to "authenticated";

grant references on table "public"."assets" to "authenticated";

grant select on table "public"."assets" to "authenticated";

grant trigger on table "public"."assets" to "authenticated";

grant truncate on table "public"."assets" to "authenticated";

grant update on table "public"."assets" to "authenticated";

grant delete on table "public"."assets" to "service_role";

grant insert on table "public"."assets" to "service_role";

grant references on table "public"."assets" to "service_role";

grant select on table "public"."assets" to "service_role";

grant trigger on table "public"."assets" to "service_role";

grant truncate on table "public"."assets" to "service_role";

grant update on table "public"."assets" to "service_role";

grant delete on table "public"."defect_logs" to "anon";

grant insert on table "public"."defect_logs" to "anon";

grant references on table "public"."defect_logs" to "anon";

grant select on table "public"."defect_logs" to "anon";

grant trigger on table "public"."defect_logs" to "anon";

grant truncate on table "public"."defect_logs" to "anon";

grant update on table "public"."defect_logs" to "anon";

grant delete on table "public"."defect_logs" to "authenticated";

grant insert on table "public"."defect_logs" to "authenticated";

grant references on table "public"."defect_logs" to "authenticated";

grant select on table "public"."defect_logs" to "authenticated";

grant trigger on table "public"."defect_logs" to "authenticated";

grant truncate on table "public"."defect_logs" to "authenticated";

grant update on table "public"."defect_logs" to "authenticated";

grant delete on table "public"."defect_logs" to "service_role";

grant insert on table "public"."defect_logs" to "service_role";

grant references on table "public"."defect_logs" to "service_role";

grant select on table "public"."defect_logs" to "service_role";

grant trigger on table "public"."defect_logs" to "service_role";

grant truncate on table "public"."defect_logs" to "service_role";

grant update on table "public"."defect_logs" to "service_role";

grant delete on table "public"."job_cards" to "anon";

grant insert on table "public"."job_cards" to "anon";

grant references on table "public"."job_cards" to "anon";

grant select on table "public"."job_cards" to "anon";

grant trigger on table "public"."job_cards" to "anon";

grant truncate on table "public"."job_cards" to "anon";

grant update on table "public"."job_cards" to "anon";

grant delete on table "public"."job_cards" to "authenticated";

grant insert on table "public"."job_cards" to "authenticated";

grant references on table "public"."job_cards" to "authenticated";

grant select on table "public"."job_cards" to "authenticated";

grant trigger on table "public"."job_cards" to "authenticated";

grant truncate on table "public"."job_cards" to "authenticated";

grant update on table "public"."job_cards" to "authenticated";

grant delete on table "public"."job_cards" to "service_role";

grant insert on table "public"."job_cards" to "service_role";

grant references on table "public"."job_cards" to "service_role";

grant select on table "public"."job_cards" to "service_role";

grant trigger on table "public"."job_cards" to "service_role";

grant truncate on table "public"."job_cards" to "service_role";

grant update on table "public"."job_cards" to "service_role";

grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."loom_stoppages" to "anon";

grant insert on table "public"."loom_stoppages" to "anon";

grant references on table "public"."loom_stoppages" to "anon";

grant select on table "public"."loom_stoppages" to "anon";

grant trigger on table "public"."loom_stoppages" to "anon";

grant truncate on table "public"."loom_stoppages" to "anon";

grant update on table "public"."loom_stoppages" to "anon";

grant delete on table "public"."loom_stoppages" to "authenticated";

grant insert on table "public"."loom_stoppages" to "authenticated";

grant references on table "public"."loom_stoppages" to "authenticated";

grant select on table "public"."loom_stoppages" to "authenticated";

grant trigger on table "public"."loom_stoppages" to "authenticated";

grant truncate on table "public"."loom_stoppages" to "authenticated";

grant update on table "public"."loom_stoppages" to "authenticated";

grant delete on table "public"."loom_stoppages" to "service_role";

grant insert on table "public"."loom_stoppages" to "service_role";

grant references on table "public"."loom_stoppages" to "service_role";

grant select on table "public"."loom_stoppages" to "service_role";

grant trigger on table "public"."loom_stoppages" to "service_role";

grant truncate on table "public"."loom_stoppages" to "service_role";

grant update on table "public"."loom_stoppages" to "service_role";

grant delete on table "public"."material_requisitions" to "anon";

grant insert on table "public"."material_requisitions" to "anon";

grant references on table "public"."material_requisitions" to "anon";

grant select on table "public"."material_requisitions" to "anon";

grant trigger on table "public"."material_requisitions" to "anon";

grant truncate on table "public"."material_requisitions" to "anon";

grant update on table "public"."material_requisitions" to "anon";

grant delete on table "public"."material_requisitions" to "authenticated";

grant insert on table "public"."material_requisitions" to "authenticated";

grant references on table "public"."material_requisitions" to "authenticated";

grant select on table "public"."material_requisitions" to "authenticated";

grant trigger on table "public"."material_requisitions" to "authenticated";

grant truncate on table "public"."material_requisitions" to "authenticated";

grant update on table "public"."material_requisitions" to "authenticated";

grant delete on table "public"."material_requisitions" to "service_role";

grant insert on table "public"."material_requisitions" to "service_role";

grant references on table "public"."material_requisitions" to "service_role";

grant select on table "public"."material_requisitions" to "service_role";

grant trigger on table "public"."material_requisitions" to "service_role";

grant truncate on table "public"."material_requisitions" to "service_role";

grant update on table "public"."material_requisitions" to "service_role";

grant delete on table "public"."purchase_orders" to "anon";

grant insert on table "public"."purchase_orders" to "anon";

grant references on table "public"."purchase_orders" to "anon";

grant select on table "public"."purchase_orders" to "anon";

grant trigger on table "public"."purchase_orders" to "anon";

grant truncate on table "public"."purchase_orders" to "anon";

grant update on table "public"."purchase_orders" to "anon";

grant delete on table "public"."purchase_orders" to "authenticated";

grant insert on table "public"."purchase_orders" to "authenticated";

grant references on table "public"."purchase_orders" to "authenticated";

grant select on table "public"."purchase_orders" to "authenticated";

grant trigger on table "public"."purchase_orders" to "authenticated";

grant truncate on table "public"."purchase_orders" to "authenticated";

grant update on table "public"."purchase_orders" to "authenticated";

grant delete on table "public"."purchase_orders" to "service_role";

grant insert on table "public"."purchase_orders" to "service_role";

grant references on table "public"."purchase_orders" to "service_role";

grant select on table "public"."purchase_orders" to "service_role";

grant trigger on table "public"."purchase_orders" to "service_role";

grant truncate on table "public"."purchase_orders" to "service_role";

grant update on table "public"."purchase_orders" to "service_role";

grant delete on table "public"."quality_inspections" to "anon";

grant insert on table "public"."quality_inspections" to "anon";

grant references on table "public"."quality_inspections" to "anon";

grant select on table "public"."quality_inspections" to "anon";

grant trigger on table "public"."quality_inspections" to "anon";

grant truncate on table "public"."quality_inspections" to "anon";

grant update on table "public"."quality_inspections" to "anon";

grant delete on table "public"."quality_inspections" to "authenticated";

grant insert on table "public"."quality_inspections" to "authenticated";

grant references on table "public"."quality_inspections" to "authenticated";

grant select on table "public"."quality_inspections" to "authenticated";

grant trigger on table "public"."quality_inspections" to "authenticated";

grant truncate on table "public"."quality_inspections" to "authenticated";

grant update on table "public"."quality_inspections" to "authenticated";

grant delete on table "public"."quality_inspections" to "service_role";

grant insert on table "public"."quality_inspections" to "service_role";

grant references on table "public"."quality_inspections" to "service_role";

grant select on table "public"."quality_inspections" to "service_role";

grant trigger on table "public"."quality_inspections" to "service_role";

grant truncate on table "public"."quality_inspections" to "service_role";

grant update on table "public"."quality_inspections" to "service_role";

grant delete on table "public"."role_permissions" to "anon";

grant insert on table "public"."role_permissions" to "anon";

grant references on table "public"."role_permissions" to "anon";

grant select on table "public"."role_permissions" to "anon";

grant trigger on table "public"."role_permissions" to "anon";

grant truncate on table "public"."role_permissions" to "anon";

grant update on table "public"."role_permissions" to "anon";

grant delete on table "public"."role_permissions" to "authenticated";

grant insert on table "public"."role_permissions" to "authenticated";

grant references on table "public"."role_permissions" to "authenticated";

grant select on table "public"."role_permissions" to "authenticated";

grant trigger on table "public"."role_permissions" to "authenticated";

grant truncate on table "public"."role_permissions" to "authenticated";

grant update on table "public"."role_permissions" to "authenticated";

grant delete on table "public"."role_permissions" to "service_role";

grant insert on table "public"."role_permissions" to "service_role";

grant references on table "public"."role_permissions" to "service_role";

grant select on table "public"."role_permissions" to "service_role";

grant trigger on table "public"."role_permissions" to "service_role";

grant truncate on table "public"."role_permissions" to "service_role";

grant update on table "public"."role_permissions" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."stock_batches" to "anon";

grant insert on table "public"."stock_batches" to "anon";

grant references on table "public"."stock_batches" to "anon";

grant select on table "public"."stock_batches" to "anon";

grant trigger on table "public"."stock_batches" to "anon";

grant truncate on table "public"."stock_batches" to "anon";

grant update on table "public"."stock_batches" to "anon";

grant delete on table "public"."stock_batches" to "authenticated";

grant insert on table "public"."stock_batches" to "authenticated";

grant references on table "public"."stock_batches" to "authenticated";

grant select on table "public"."stock_batches" to "authenticated";

grant trigger on table "public"."stock_batches" to "authenticated";

grant truncate on table "public"."stock_batches" to "authenticated";

grant update on table "public"."stock_batches" to "authenticated";

grant delete on table "public"."stock_batches" to "service_role";

grant insert on table "public"."stock_batches" to "service_role";

grant references on table "public"."stock_batches" to "service_role";

grant select on table "public"."stock_batches" to "service_role";

grant trigger on table "public"."stock_batches" to "service_role";

grant truncate on table "public"."stock_batches" to "service_role";

grant update on table "public"."stock_batches" to "service_role";

grant delete on table "public"."tenants" to "anon";

grant insert on table "public"."tenants" to "anon";

grant references on table "public"."tenants" to "anon";

grant select on table "public"."tenants" to "anon";

grant trigger on table "public"."tenants" to "anon";

grant truncate on table "public"."tenants" to "anon";

grant update on table "public"."tenants" to "anon";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant references on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant trigger on table "public"."tenants" to "authenticated";

grant truncate on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant references on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant trigger on table "public"."tenants" to "service_role";

grant truncate on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

-- Secure the tables
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."accounts" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."assets" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."defect_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."defect_logs" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."job_cards" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."job_cards" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."locations" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."loom_stoppages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."loom_stoppages" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."material_requisitions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."material_requisitions" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."purchase_orders" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."quality_inspections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."quality_inspections" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."stock_batches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."stock_batches" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."tenants" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);






