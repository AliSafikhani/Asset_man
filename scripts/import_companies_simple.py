import psycopg2
import json
import os

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="webapp_db",
    user="postgres",
    password="sekert1!"
)

cursor = conn.cursor()

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Build the path to the JSON file
json_path = os.path.join(script_dir, 'data_samples', 'companies_sample.json')

# Check if file exists
if not os.path.exists(json_path):
    print(f"❌ Error: File not found at {json_path}")
    print("Please make sure the file exists in the data_samples folder")
    exit()

# Load JSON data
with open(json_path, 'r') as f:
    companies = json.load(f)

print(f"📖 Loading {len(companies)} companies from: {json_path}\n")

# Insert each company
success_count = 0
fail_count = 0

for company in companies:
    try:
        cursor.execute("""
            INSERT INTO companies (
                name, code, abbreviation, company_type,
                contact_person, contact_email, contact_phone,
                address_line1, address_line2, city, state,
                country, postal_code, status,
                metadata, parent_company_id, address,
                phone, email, extra_data
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            company.get('name'),
            company.get('code'),
            company.get('abbreviation'),
            company.get('company_type'),
            company.get('contact_person'),
            company.get('contact_email'),
            company.get('contact_phone'),
            company.get('address_line1'),
            company.get('address_line2'),
            company.get('city'),
            company.get('state'),
            company.get('country'),
            company.get('postal_code'),
            company.get('status', 'active'),
            json.dumps(company.get('metadata', {})),
            company.get('parent_company_id'),
            company.get('address'),
            company.get('phone'),
            company.get('email'),
            json.dumps(company.get('extra_data', {}))
        ))
        print(f"✅ Inserted: {company.get('name')} ({company.get('code')})")
        success_count += 1
        
    except psycopg2.Error as e:
        print(f"❌ Failed: {company.get('name')} - {e}")
        fail_count += 1
        conn.rollback()

# Commit and close
conn.commit()
cursor.close()
conn.close()

print(f"\n🎉 Done!")
print(f"✅ Successfully inserted: {success_count}")
print(f"❌ Failed: {fail_count}")