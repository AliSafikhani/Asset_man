# Overwrite the script file with corrected JSON
$filePath = "D:\4_PROGRAMMING\12_ELECTRICAL_MONITORING_APP\4_EMA_4\test_maintenance_db_insert.ps1"

$correctedContent = @'
# test_maintenance_db_insert.ps1
# PowerShell script to insert a maintenance activity directly into PostgreSQL

# Database credentials
$env:PGPASSWORD = "sekert1!"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "webapp_db"

# SQL INSERT statement with PROPER JSON formatting (keys double-quoted)
$SQL = @"
INSERT INTO maintenance_activities (
    plant_id,
    asset_id,
    title,
    description,
    maintenance_order,
    maintenance_section,
    priority,
    status,
    scheduled_date,
    assigned_technician,
    meter_reading,
    labor_cost,
    parts_cost,
    findings_description,
    action_taken,
    attachments,
    recommended_next_date,
    extra_data,
    created_by
)
SELECT 
    a.plant_id,
    a.id,
    'Test Oil Analysis (Direct DB)' AS title,
    'Performing quarterly oil sampling and analysis' AS description,
    'minor' AS maintenance_order,
    'Oil' AS maintenance_section,
    'medium' AS priority,
    'planned' AS status,
    '2026-07-28 10:00:00' AS scheduled_date,
    NULL AS assigned_technician,
    1250.50 AS meter_reading,
    150.00 AS labor_cost,
    45.00 AS parts_cost,
    'Oil sample taken for lab analysis. Visual inspection passed.' AS findings_description,
    'Sampled 500ml and sent to external lab for DGA analysis.' AS action_taken,
    '[]'::jsonb AS attachments,
    '2026-10-28 10:00:00' AS recommended_next_date,
    '{"oil_temp_c": 72.5, "dissolved_gas_h2_ppm": 2.8, "moisture_content_ppm": 10.2}'::jsonb AS extra_data,
    1 AS created_by
FROM assets a
WHERE a.operational_status = 'active'
LIMIT 1
RETURNING id, title, asset_id, plant_id, status, total_cost;
"@

Write-Host "=== Inserting Maintenance Activity Directly into PostgreSQL ===" -ForegroundColor Cyan

# Run the SQL command
$result = psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "$SQL"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! Activity inserted successfully." -ForegroundColor Green
    Write-Host $result -ForegroundColor Yellow
} else {
    Write-Host "❌ ERROR: Failed to insert. Check your database connection and schema." -ForegroundColor Red
}

# Clear the password environment variable
Remove-Item Env:PGPASSWORD
'@

# Write the corrected content to the file
Set-Content -Path $filePath -Value $correctedContent -Encoding UTF8

Write-Host "✅ File updated with corrected JSON!" -ForegroundColor Green
Write-Host "`nNow running the script..." -ForegroundColor Yellow
Write-Host ""

# Run the script
& $filePath