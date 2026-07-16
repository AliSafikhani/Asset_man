# D:\4_PROGRAMMING\12_ELECTRICAL_MONITORING_APP\4_EMA_4\backend\scripts\1_generator_post.py

import requests
import json
import sys

# API endpoint
API_URL = "http://localhost:8000/api/v1/assets/"

# Generator test data
generator_data = {
    "plant_id": 1,
    "asset_type": "generator",
    "asset_name": "Generator G-109",
    "asset_code": "GEN-009",
    "asset_tag": "G-109",
    "manufacturer": "General Electric",
    "model": "GE-7F.04",
    "serial_number": "GE-2024-001",
    "manufacturing_year": 2023,
    "installation_date": "2024-01-15",
    "commissioning_date": "2024-03-01",
    "operational_status": "active",
    "criticality_level": "high",
    "location_within_plant": "Turbine Hall, Bay A",
    "technical_documentation_url": "https://docs.example.com/generator-ge-7f04",
    "photo_url": "https://images.example.com/generator-ge-7f04.jpg",
    "generator": {
        # Basic Specifications
        "generator_type": "Synchronous",
        "prime_mover_type": "Gas Turbine",
        "fuel_type": "Natural Gas",
        "power_rating_mw": 150.0,
        "power_rating_mva": 187.5,
        "power_factor": 0.85,
        "efficiency_percent": 98.5,
        
        # Electrical Parameters
        "voltage_kv": 11.0,
        "current_a": 9830.0,
        "frequency_hz": 50.0,
        "number_of_phases": 3,
        "stator_connection": "Star",
        "rotor_connection": "Star",
        
        # Synchronous Generator Parameters
        "synchronous_reactance_xd": 1.8,
        "transient_reactance_xd": 0.3,
        "subtransient_reactance_xd": 0.15,
        "inertia_constant_h": 4.5,
        "short_circuit_ratio": 0.6,
        
        # Induction Generator Parameters
        "rotor_resistance_r2": 0.02,
        "stator_resistance_r1": 0.01,
        "slip_at_rated_load": 2.5,
        
        # Physical Characteristics
        "cooling_method": "Hydrogen Cooled",
        "insulation_class": "F",
        "bearing_type": "Sleeve",
        "rotor_speed_rpm": 3000,
        "weight_kg": 85000.0,
        
        # Operational Limits
        "max_continuous_power_mw": 160.0,
        "min_load_percent": 30.0
    }
}

def post_generator():
    try:
        print("📤 Posting Generator asset...")
        print(f"   URL: {API_URL}")
        print(f"   Asset Name: {generator_data['asset_name']}")
        print(f"   Asset Code: {generator_data['asset_code']}")
        
        response = requests.post(
            API_URL,
            json=generator_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Generator created successfully!")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
            return response.json()
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on http://localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Generator Asset Creation Script")
    print("=" * 60)
    post_generator()