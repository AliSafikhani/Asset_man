# D:\4_PROGRAMMING\12_ELECTRICAL_MONITORING_APP\4_EMA_4\backend\scripts\3_transformer_post.py

import requests
import json
import sys

# API endpoint
API_URL = "http://localhost:8000/api/v1/assets/"

# Transformer test data
transformer_data = {
    "plant_id": 1,
    "asset_type": "transformer",
    "asset_name": "Transformer T-302ali",
    "asset_code": "TRF-002ali",
    "asset_tag": "T-302ali",
    "manufacturer": "ABB",
    "model": "ABB-132/33",
    "serial_number": "ABB-2024-001",
    "manufacturing_year": 2003,
    "installation_date": "2004-01-10",
    "commissioning_date": "2004-02-15",
    "operational_status": "active",
    "criticality_level": "critical",
    "location_within_plant": "Substation, Bay C",
    "technical_documentation_url": "https://docs.example.com/transformer-abb-132-33",
    "photo_url": "https://images.example.com/transformer-abb-132-33.jpg",
    "transformer": {
        # Basic Specifications
        "transformer_type": "Power Transformer",
        "cooling_type": "ONAN",
        "number_of_windings": 2,
        
        # Power Ratings
        "power_rating_mva": 50.0,
        "power_rating_mva_forced": 60.0,
        
        # Voltage Ratings
        "hv_voltage_kv": 132.0,
        "lv_voltage_kv": 33.0,
        "tertiary_voltage_kv": None,
        "hv_tap_range_percent": 10.0,
        "number_of_taps": 17,
        
        # Impedance
        "impedance_percent": 12.5,
        "hv_resistance_ohms": 0.5,
        "lv_resistance_ohms": 0.05,
        "magnetizing_current_percent": 1.5,
        
        # Insulation
        "insulation_type": "Oil Immersed",
        "insulation_class": "B",
        "insulation_level_hv_kv": 550.0,
        "insulation_level_lv_kv": 170.0,
        
        # Physical
        "vector_group": "Dyn11",
        "frequency_hz": 50.0,
        "oil_type": "Mineral Oil",
        "oil_volume_liters": 25000.0,
        "weight_kg": 120000.0,
        
        # Operational
        "no_load_loss_w": 45000.0,
        "load_loss_w": 250000.0,
        "efficiency_percent": 99.5,
        "temperature_rise_oil_c": 55.0,
        "temperature_rise_winding_c": 65.0,
        
        # Accessories
        "has_on_load_tap_changer": True,
        "has_buchholz_relay": True,
        "has_pressure_relief": True
    }
}

def post_transformer():
    try:
        print("📤 Posting Transformer asset...")
        print(f"   URL: {API_URL}")
        print(f"   Asset Name: {transformer_data['asset_name']}")
        print(f"   Asset Code: {transformer_data['asset_code']}")
        
        response = requests.post(
            API_URL,
            json=transformer_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Transformer created successfully!")
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
    print("Transformer Asset Creation Script")
    print("=" * 60)
    post_transformer()