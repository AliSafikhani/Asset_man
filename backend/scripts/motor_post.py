# D:\4_PROGRAMMING\12_ELECTRICAL_MONITORING_APP\4_EMA_4\backend\scripts\2_motor_post.py

import requests
import json
import sys

# API endpoint
API_URL = "http://localhost:8000/api/v1/assets/"

# Motor test data
motor_data = {
    "plant_id": 1,
    "asset_type": "motor",
    "asset_name": "Motor M-201",
    "asset_code": "MOT-001",
    "asset_tag": "M-201",
    "manufacturer": "Siemens",
    "model": "Siemens-1LA8",
    "serial_number": "SI-2024-001",
    "manufacturing_year": 2023,
    "installation_date": "2024-02-01",
    "commissioning_date": "2024-03-15",
    "operational_status": "active",
    "criticality_level": "high",
    "location_within_plant": "Compressor Building, Bay B",
    "technical_documentation_url": "https://docs.example.com/motor-siemens-1la8",
    "photo_url": "https://images.example.com/motor-siemens-1la8.jpg",
    "motor": {
        # Basic Specifications
        "motor_type": "Induction",
        "frame_size": "315L",
        "mounting_type": "Horizontal",
        "duty_type": "S1 - Continuous",
        "enclosure_type": "Totally Enclosed Fan-Cooled",
        
        # Power Ratings
        "power_hp": 500.0,
        "power_kw": 375.0,
        "service_factor": 1.15,
        
        # Electrical Parameters
        "voltage_v": 6600.0,
        "current_a": 52.0,
        "starting_current_a": 312.0,
        "frequency_hz": 50.0,
        "number_of_phases": 3,
        
        # Induction Motor
        "synchronous_speed_rpm": 1500,
        "full_load_speed_rpm": 1485,
        "slip_percent": 1.0,
        "nema_design": "B",
        
        # Efficiency
        "efficiency_class": "IE3",
        "efficiency_100_percent": 96.5,
        "efficiency_75_percent": 96.8,
        "efficiency_50_percent": 96.2,
        
        # Physical
        "bearing_type": "Roller",
        "shaft_diameter_mm": 80.0,
        "weight_kg": 2000.0,
        "inertia_kg_m2": 5.2,
        
        # Environmental
        "insulation_class": "F",
        "temperature_rise_c": 80.0,
        "ip_rating": "IP55",
        
        # VFD Compatibility
        "vfd_compatible": True
    }
}

def post_motor():
    try:
        print("📤 Posting Motor asset...")
        print(f"   URL: {API_URL}")
        print(f"   Asset Name: {motor_data['asset_name']}")
        print(f"   Asset Code: {motor_data['asset_code']}")
        
        response = requests.post(
            API_URL,
            json=motor_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Motor created successfully!")
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
    print("Motor Asset Creation Script")
    print("=" * 60)
    post_motor()