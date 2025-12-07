// Tauri commands for Roadmap Planner
// All CRUD operations for entities

use crate::db::{
    Capability, Constraint, FinancialPeriod, Initiative, Resource, ResourcePool, Scenario, System,
    get_current_timestamp,
};
use tauri::State;
use tauri_plugin_sql::{Migration, MigrationKind};

// Type alias for the database connection
pub type DbState = tauri::State<'_, tauri_plugin_sql::DbInstances>;

// ============================================
// CAPABILITIES COMMANDS
// ============================================

#[tauri::command]
pub async fn get_capabilities(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<Capability>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<Capability> = sqlx::query_as!(
        Capability,
        r#"SELECT
            id, name, description,
            type as "capability_type",
            parent_id, colour, sort_order,
            created_at, updated_at
        FROM capabilities ORDER BY sort_order, name"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_capability(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<Capability, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: Capability = sqlx::query_as!(
        Capability,
        r#"SELECT
            id, name, description,
            type as "capability_type",
            parent_id, colour, sort_order,
            created_at, updated_at
        FROM capabilities WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_capability(db: State<'_, tauri_plugin_sql::DbInstances>, capability: Capability) -> Result<Capability, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO capabilities (id, name, description, type, parent_id, colour, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        capability.id,
        capability.name,
        capability.description,
        capability.capability_type,
        capability.parent_id,
        capability.colour,
        capability.sort_order,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_capability(db, capability.id).await
}

#[tauri::command]
pub async fn update_capability(db: State<'_, tauri_plugin_sql::DbInstances>, capability: Capability) -> Result<Capability, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE capabilities SET
            name = ?, description = ?, type = ?, parent_id = ?,
            colour = ?, sort_order = ?, updated_at = ?
        WHERE id = ?"#,
        capability.name,
        capability.description,
        capability.capability_type,
        capability.parent_id,
        capability.colour,
        capability.sort_order,
        now,
        capability.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_capability(db, capability.id).await
}

#[tauri::command]
pub async fn delete_capability(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM capabilities WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// SYSTEMS COMMANDS
// ============================================

#[tauri::command]
pub async fn get_systems(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<System>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<System> = sqlx::query_as!(
        System,
        r#"SELECT
            id, name, description, owner, vendor, technology_stack,
            lifecycle_stage, criticality, support_end_date, extended_support_end_date,
            capability_id, created_at, updated_at
        FROM systems ORDER BY name"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_system(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<System, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: System = sqlx::query_as!(
        System,
        r#"SELECT
            id, name, description, owner, vendor, technology_stack,
            lifecycle_stage, criticality, support_end_date, extended_support_end_date,
            capability_id, created_at, updated_at
        FROM systems WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn get_systems_by_capability(db: State<'_, tauri_plugin_sql::DbInstances>, capability_id: String) -> Result<Vec<System>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<System> = sqlx::query_as!(
        System,
        r#"SELECT
            id, name, description, owner, vendor, technology_stack,
            lifecycle_stage, criticality, support_end_date, extended_support_end_date,
            capability_id, created_at, updated_at
        FROM systems WHERE capability_id = ? ORDER BY name"#,
        capability_id
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn create_system(db: State<'_, tauri_plugin_sql::DbInstances>, system: System) -> Result<System, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();
    let tech_stack_json = system.technology_stack.as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default());

    sqlx::query!(
        r#"INSERT INTO systems (id, name, description, owner, vendor, technology_stack,
            lifecycle_stage, criticality, support_end_date, extended_support_end_date,
            capability_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        system.id,
        system.name,
        system.description,
        system.owner,
        system.vendor,
        tech_stack_json,
        system.lifecycle_stage,
        system.criticality,
        system.support_end_date,
        system.extended_support_end_date,
        system.capability_id,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_system(db, system.id).await
}

#[tauri::command]
pub async fn update_system(db: State<'_, tauri_plugin_sql::DbInstances>, system: System) -> Result<System, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();
    let tech_stack_json = system.technology_stack.as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default());

    sqlx::query!(
        r#"UPDATE systems SET
            name = ?, description = ?, owner = ?, vendor = ?, technology_stack = ?,
            lifecycle_stage = ?, criticality = ?, support_end_date = ?, extended_support_end_date = ?,
            capability_id = ?, updated_at = ?
        WHERE id = ?"#,
        system.name,
        system.description,
        system.owner,
        system.vendor,
        tech_stack_json,
        system.lifecycle_stage,
        system.criticality,
        system.support_end_date,
        system.extended_support_end_date,
        system.capability_id,
        now,
        system.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_system(db, system.id).await
}

#[tauri::command]
pub async fn delete_system(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM systems WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// INITIATIVES COMMANDS
// ============================================

#[tauri::command]
pub async fn get_initiatives(db: State<'_, tauri_plugin_sql::DbInstances>, scenario_id: Option<String>) -> Result<Vec<Initiative>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<Initiative> = match scenario_id {
        Some(sid) => sqlx::query_as!(
            Initiative,
            r#"SELECT
                id, name, description, type as "initiative_type", status,
                start_date, end_date, effort_estimate, effort_uncertainty,
                cost_estimate, cost_uncertainty, priority, scenario_id,
                created_at, updated_at
            FROM initiatives WHERE scenario_id = ? ORDER BY start_date, name"#,
            sid
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?,
        None => sqlx::query_as!(
            Initiative,
            r#"SELECT
                id, name, description, type as "initiative_type", status,
                start_date, end_date, effort_estimate, effort_uncertainty,
                cost_estimate, cost_uncertainty, priority, scenario_id,
                created_at, updated_at
            FROM initiatives ORDER BY start_date, name"#
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?,
    };

    Ok(rows)
}

#[tauri::command]
pub async fn get_initiative(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<Initiative, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: Initiative = sqlx::query_as!(
        Initiative,
        r#"SELECT
            id, name, description, type as "initiative_type", status,
            start_date, end_date, effort_estimate, effort_uncertainty,
            cost_estimate, cost_uncertainty, priority, scenario_id,
            created_at, updated_at
        FROM initiatives WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_initiative(db: State<'_, tauri_plugin_sql::DbInstances>, initiative: Initiative) -> Result<Initiative, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO initiatives (id, name, description, type, status,
            start_date, end_date, effort_estimate, effort_uncertainty,
            cost_estimate, cost_uncertainty, priority, scenario_id,
            created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        initiative.id,
        initiative.name,
        initiative.description,
        initiative.initiative_type,
        initiative.status,
        initiative.start_date,
        initiative.end_date,
        initiative.effort_estimate,
        initiative.effort_uncertainty,
        initiative.cost_estimate,
        initiative.cost_uncertainty,
        initiative.priority,
        initiative.scenario_id,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_initiative(db, initiative.id).await
}

#[tauri::command]
pub async fn update_initiative(db: State<'_, tauri_plugin_sql::DbInstances>, initiative: Initiative) -> Result<Initiative, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE initiatives SET
            name = ?, description = ?, type = ?, status = ?,
            start_date = ?, end_date = ?, effort_estimate = ?, effort_uncertainty = ?,
            cost_estimate = ?, cost_uncertainty = ?, priority = ?, scenario_id = ?,
            updated_at = ?
        WHERE id = ?"#,
        initiative.name,
        initiative.description,
        initiative.initiative_type,
        initiative.status,
        initiative.start_date,
        initiative.end_date,
        initiative.effort_estimate,
        initiative.effort_uncertainty,
        initiative.cost_estimate,
        initiative.cost_uncertainty,
        initiative.priority,
        initiative.scenario_id,
        now,
        initiative.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_initiative(db, initiative.id).await
}

#[tauri::command]
pub async fn delete_initiative(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM initiatives WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// SCENARIOS COMMANDS
// ============================================

#[tauri::command]
pub async fn get_scenarios(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<Scenario>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<Scenario> = sqlx::query_as!(
        Scenario,
        r#"SELECT
            id, name, description, type as "scenario_type",
            is_baseline, parent_scenario_id, created_at, updated_at
        FROM scenarios ORDER BY is_baseline DESC, name"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_scenario(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<Scenario, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: Scenario = sqlx::query_as!(
        Scenario,
        r#"SELECT
            id, name, description, type as "scenario_type",
            is_baseline, parent_scenario_id, created_at, updated_at
        FROM scenarios WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_scenario(db: State<'_, tauri_plugin_sql::DbInstances>, scenario: Scenario) -> Result<Scenario, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO scenarios (id, name, description, type, is_baseline, parent_scenario_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        scenario.id,
        scenario.name,
        scenario.description,
        scenario.scenario_type,
        scenario.is_baseline,
        scenario.parent_scenario_id,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_scenario(db, scenario.id).await
}

#[tauri::command]
pub async fn update_scenario(db: State<'_, tauri_plugin_sql::DbInstances>, scenario: Scenario) -> Result<Scenario, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE scenarios SET
            name = ?, description = ?, type = ?, parent_scenario_id = ?, updated_at = ?
        WHERE id = ?"#,
        scenario.name,
        scenario.description,
        scenario.scenario_type,
        scenario.parent_scenario_id,
        now,
        scenario.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_scenario(db, scenario.id).await
}

#[tauri::command]
pub async fn delete_scenario(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    // Cannot delete baseline scenario
    if id == "baseline" {
        return Err("Cannot delete the baseline scenario".to_string());
    }

    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    // Check if scenario is baseline
    let scenario = get_scenario(db.clone(), id.clone()).await?;
    if scenario.is_baseline {
        return Err("Cannot delete the baseline scenario".to_string());
    }

    sqlx::query!("DELETE FROM scenarios WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// RESOURCE POOLS COMMANDS
// ============================================

#[tauri::command]
pub async fn get_resource_pools(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<ResourcePool>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<ResourcePool> = sqlx::query_as!(
        ResourcePool,
        r#"SELECT
            id, name, description, capacity_per_period,
            capacity_unit, period_type, colour, created_at, updated_at
        FROM resource_pools ORDER BY name"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_resource_pool(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<ResourcePool, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: ResourcePool = sqlx::query_as!(
        ResourcePool,
        r#"SELECT
            id, name, description, capacity_per_period,
            capacity_unit, period_type, colour, created_at, updated_at
        FROM resource_pools WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_resource_pool(db: State<'_, tauri_plugin_sql::DbInstances>, pool_data: ResourcePool) -> Result<ResourcePool, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO resource_pools (id, name, description, capacity_per_period, capacity_unit, period_type, colour, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        pool_data.id,
        pool_data.name,
        pool_data.description,
        pool_data.capacity_per_period,
        pool_data.capacity_unit,
        pool_data.period_type,
        pool_data.colour,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_resource_pool(db, pool_data.id).await
}

#[tauri::command]
pub async fn update_resource_pool(db: State<'_, tauri_plugin_sql::DbInstances>, pool_data: ResourcePool) -> Result<ResourcePool, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE resource_pools SET
            name = ?, description = ?, capacity_per_period = ?,
            capacity_unit = ?, period_type = ?, colour = ?, updated_at = ?
        WHERE id = ?"#,
        pool_data.name,
        pool_data.description,
        pool_data.capacity_per_period,
        pool_data.capacity_unit,
        pool_data.period_type,
        pool_data.colour,
        now,
        pool_data.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_resource_pool(db, pool_data.id).await
}

#[tauri::command]
pub async fn delete_resource_pool(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM resource_pools WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// RESOURCES COMMANDS
// ============================================

#[tauri::command]
pub async fn get_resources(db: State<'_, tauri_plugin_sql::DbInstances>, pool_id: Option<String>) -> Result<Vec<Resource>, String> {
    let db_pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<Resource> = match pool_id {
        Some(pid) => sqlx::query_as!(
            Resource,
            r#"SELECT
                id, name, role, skills, availability,
                resource_pool_id, start_date, end_date, created_at, updated_at
            FROM resources WHERE resource_pool_id = ? ORDER BY name"#,
            pid
        )
        .fetch_all(db_pool)
        .await
        .map_err(|e| e.to_string())?,
        None => sqlx::query_as!(
            Resource,
            r#"SELECT
                id, name, role, skills, availability,
                resource_pool_id, start_date, end_date, created_at, updated_at
            FROM resources ORDER BY name"#
        )
        .fetch_all(db_pool)
        .await
        .map_err(|e| e.to_string())?,
    };

    Ok(rows)
}

#[tauri::command]
pub async fn get_resource(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<Resource, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: Resource = sqlx::query_as!(
        Resource,
        r#"SELECT
            id, name, role, skills, availability,
            resource_pool_id, start_date, end_date, created_at, updated_at
        FROM resources WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_resource(db: State<'_, tauri_plugin_sql::DbInstances>, resource: Resource) -> Result<Resource, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();
    let skills_json = resource.skills.as_ref()
        .map(|s| serde_json::to_string(s).unwrap_or_default());

    sqlx::query!(
        r#"INSERT INTO resources (id, name, role, skills, availability, resource_pool_id, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        resource.id,
        resource.name,
        resource.role,
        skills_json,
        resource.availability,
        resource.resource_pool_id,
        resource.start_date,
        resource.end_date,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_resource(db, resource.id).await
}

#[tauri::command]
pub async fn update_resource(db: State<'_, tauri_plugin_sql::DbInstances>, resource: Resource) -> Result<Resource, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();
    let skills_json = resource.skills.as_ref()
        .map(|s| serde_json::to_string(s).unwrap_or_default());

    sqlx::query!(
        r#"UPDATE resources SET
            name = ?, role = ?, skills = ?, availability = ?,
            resource_pool_id = ?, start_date = ?, end_date = ?, updated_at = ?
        WHERE id = ?"#,
        resource.name,
        resource.role,
        skills_json,
        resource.availability,
        resource.resource_pool_id,
        resource.start_date,
        resource.end_date,
        now,
        resource.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_resource(db, resource.id).await
}

#[tauri::command]
pub async fn delete_resource(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM resources WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// CONSTRAINTS COMMANDS
// ============================================

#[tauri::command]
pub async fn get_constraints(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<Constraint>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<Constraint> = sqlx::query_as!(
        Constraint,
        r#"SELECT
            id, name, description, type as "constraint_type",
            hardness, effective_date, expiry_date, created_at, updated_at
        FROM constraints ORDER BY name"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_constraint(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<Constraint, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let row: Constraint = sqlx::query_as!(
        Constraint,
        r#"SELECT
            id, name, description, type as "constraint_type",
            hardness, effective_date, expiry_date, created_at, updated_at
        FROM constraints WHERE id = ?"#,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn create_constraint(db: State<'_, tauri_plugin_sql::DbInstances>, constraint: Constraint) -> Result<Constraint, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO constraints (id, name, description, type, hardness, effective_date, expiry_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        constraint.id,
        constraint.name,
        constraint.description,
        constraint.constraint_type,
        constraint.hardness,
        constraint.effective_date,
        constraint.expiry_date,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_constraint(db, constraint.id).await
}

#[tauri::command]
pub async fn update_constraint(db: State<'_, tauri_plugin_sql::DbInstances>, constraint: Constraint) -> Result<Constraint, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE constraints SET
            name = ?, description = ?, type = ?, hardness = ?,
            effective_date = ?, expiry_date = ?, updated_at = ?
        WHERE id = ?"#,
        constraint.name,
        constraint.description,
        constraint.constraint_type,
        constraint.hardness,
        constraint.effective_date,
        constraint.expiry_date,
        now,
        constraint.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    get_constraint(db, constraint.id).await
}

#[tauri::command]
pub async fn delete_constraint(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM constraints WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// FINANCIAL PERIODS COMMANDS
// ============================================

#[tauri::command]
pub async fn get_financial_periods(db: State<'_, tauri_plugin_sql::DbInstances>) -> Result<Vec<FinancialPeriod>, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let rows: Vec<FinancialPeriod> = sqlx::query_as!(
        FinancialPeriod,
        r#"SELECT
            id, name, type as "period_type",
            start_date, end_date, budget_available, created_at, updated_at
        FROM financial_periods ORDER BY start_date"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn create_financial_period(db: State<'_, tauri_plugin_sql::DbInstances>, period: FinancialPeriod) -> Result<FinancialPeriod, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"INSERT INTO financial_periods (id, name, type, start_date, end_date, budget_available, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        period.id,
        period.name,
        period.period_type,
        period.start_date,
        period.end_date,
        period.budget_available,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // Return the created period
    let row: FinancialPeriod = sqlx::query_as!(
        FinancialPeriod,
        r#"SELECT
            id, name, type as "period_type",
            start_date, end_date, budget_available, created_at, updated_at
        FROM financial_periods WHERE id = ?"#,
        period.id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn update_financial_period(db: State<'_, tauri_plugin_sql::DbInstances>, period: FinancialPeriod) -> Result<FinancialPeriod, String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    let now = get_current_timestamp();

    sqlx::query!(
        r#"UPDATE financial_periods SET
            name = ?, type = ?, start_date = ?, end_date = ?, budget_available = ?, updated_at = ?
        WHERE id = ?"#,
        period.name,
        period.period_type,
        period.start_date,
        period.end_date,
        period.budget_available,
        now,
        period.id
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // Return the updated period
    let row: FinancialPeriod = sqlx::query_as!(
        FinancialPeriod,
        r#"SELECT
            id, name, type as "period_type",
            start_date, end_date, budget_available, created_at, updated_at
        FROM financial_periods WHERE id = ?"#,
        period.id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub async fn delete_financial_period(db: State<'_, tauri_plugin_sql::DbInstances>, id: String) -> Result<(), String> {
    let pool = db.0.get("sqlite:roadmap.db")
        .ok_or_else(|| "Database not found".to_string())?;

    sqlx::query!("DELETE FROM financial_periods WHERE id = ?", id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
