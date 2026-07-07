# backend/algorithms/transformer/dga/ml_dga_algorithm.py

"""
ML DGA Algorithm using XGBoost Model
Predicts fault types based on DGA gas concentrations using a trained ML model
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from algorithms.base import BaseAlgorithm
from .zones import MLDGAFaultStatus


class MLDGA1(BaseAlgorithm):
    """ML DGA Algorithm using XGBoost - Model 1"""
    
    def __init__(self):
        super().__init__(
            name="ML DGA 1",
            description="Machine Learning based DGA interpretation using XGBoost - Model 1",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        
        # Get the absolute path to the ml1 directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = os.path.join(current_dir, "ml1")
        
        # Path to model files (without suffix for ML_1)
        self.model_path = os.path.join(self.model_dir, "xgb_dga_fault_model.joblib")
        self.encoder_path = os.path.join(self.model_dir, "dga_fault_label_encoder.joblib")
        self.order_path = os.path.join(self.model_dir, "dga_feature_order.joblib")
        
        print(f"📍 Model directory: {self.model_dir}")
        print(f"📍 Model path: {self.model_path}")
        print(f"📍 Encoder path: {self.encoder_path}")
        print(f"📍 Order path: {self.order_path}")
        
        # Feature mapping from our gas names to model feature names
        self.feature_map = {
            'h2': 'H2',
            'ch4': 'CH4',
            'c2h6': 'C2H6',
            'c2h4': 'C2H4',
            'c2h2': 'C2H2',
            'co': 'CO',
            'co2': 'CO2'
        }
        
        # Model components
        self._model = None
        self._label_encoder = None
        self._feature_order = None
        
        # Load the model components
        self._load_models()
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h6', 'c2h4', 'c2h2', 'co', 'co2']
    
    def get_visualization_type(self) -> str:
        return "bar"
    
    def _load_models(self):
        """Load the ML model components from joblib files"""
        try:
            # Check if model file exists
            print(f"🔍 Checking if model file exists: {self.model_path}")
            if not os.path.exists(self.model_path):
                print(f"❌ Model file not found: {self.model_path}")
                self._model = None
                self._label_encoder = None
                self._feature_order = None
                return
            
            print(f"✅ Model file found: {self.model_path}")
            print(f"📄 File size: {os.path.getsize(self.model_path)} bytes")
            
            # Load the model
            try:
                print("📥 Loading model...")
                self._model = joblib.load(self.model_path)
                print(f"✅ Model loaded successfully")
                print(f"   Model type: {type(self._model)}")
            except Exception as e:
                print(f"❌ Error loading model: {e}")
                import traceback
                traceback.print_exc()
                self._model = None
                self._label_encoder = None
                self._feature_order = None
                return
            
            # Load encoder
            try:
                print(f"📥 Loading encoder from: {self.encoder_path}")
                if os.path.exists(self.encoder_path):
                    self._label_encoder = joblib.load(self.encoder_path)
                    print(f"✅ Encoder loaded")
                    print(f"   Classes: {self._label_encoder.classes_}")
                else:
                    print(f"❌ Encoder not found: {self.encoder_path}")
                    self._model = None
                    self._label_encoder = None
                    self._feature_order = None
                    return
            except Exception as e:
                print(f"❌ Error loading encoder: {e}")
                import traceback
                traceback.print_exc()
                self._model = None
                self._label_encoder = None
                self._feature_order = None
                return
            
            # Load feature order
            try:
                print(f"📥 Loading feature order from: {self.order_path}")
                if os.path.exists(self.order_path):
                    self._feature_order = joblib.load(self.order_path)
                    print(f"✅ Feature order loaded")
                    print(f"   Features: {self._feature_order}")
                else:
                    print(f"❌ Feature order not found: {self.order_path}")
                    self._model = None
                    self._label_encoder = None
                    self._feature_order = None
                    return
            except Exception as e:
                print(f"❌ Error loading feature order: {e}")
                import traceback
                traceback.print_exc()
                self._model = None
                self._label_encoder = None
                self._feature_order = None
                return
            
            print(f"✅ ML DGA Model loaded successfully!")
            print(f"   Features: {self._feature_order}")
            print(f"   Fault classes: {self._label_encoder.classes_}")
            
        except Exception as e:
            print(f"❌ Error loading ML model: {e}")
            import traceback
            traceback.print_exc()
            self._model = None
            self._label_encoder = None
            self._feature_order = None
    
    def is_available(self) -> bool:
        """Check if the ML model is available"""
        return self._model is not None and self._label_encoder is not None
    
    def _prepare_features(self, parameters: Dict[str, Any]) -> Optional[np.ndarray]:
        """Prepare features for the ML model"""
        if not self.is_available():
            return None
        
        try:
            # Build feature array in the correct order
            features = []
            for model_feature in self._feature_order:
                # Handle 'sn' feature - set to 0 (or could be sample number)
                if model_feature.lower() == 'sn':
                    features.append(0)  # Default value
                    continue
                
                # Find the corresponding gas value
                gas_value = 0
                found = False
                
                # Try to find in our feature map
                for our_key, model_key in self.feature_map.items():
                    if model_key == model_feature:
                        gas_value = float(parameters.get(our_key, 0) or 0)
                        found = True
                        break
                
                # If not found in our mapping, try direct lookup (case insensitive)
                if not found:
                    # Try the parameter directly (lowercase)
                    gas_value = float(parameters.get(model_feature.lower(), 0) or 0)
                    
                    # If still 0, try with '2' suffix for CO2
                    if gas_value == 0 and model_feature.lower() == 'co2':
                        gas_value = float(parameters.get('co2', 0) or 0)
                
                features.append(gas_value)
            
            # Convert to numpy array
            features_array = np.array([features])
            
            print(f"📊 Prepared features: {features_array[0]}")
            return features_array
            
        except Exception as e:
            print(f"❌ Error preparing features: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate ML-based DGA fault prediction"""
        
        print(f"   📊 MLDGAAlgorithm.calculate() called with parameters: {parameters}")
        
        # Check if model is available
        if not self.is_available():
            print(f"   ⚠️ ML Model not available")
            return {
                "fault_type": MLDGAFaultStatus.UNK,
                "fault_name": "Model Not Available",
                "zone_color": "#95A5A6",
                "probabilities": {},
                "top_3": [],
                "raw_values": {k: parameters.get(k, 0) for k in self.get_required_parameters()}
            }
        
        # Check if we have valid gas data
        has_data = any(float(parameters.get(k, 0) or 0) > 0 for k in self.get_required_parameters())
        if not has_data:
            print(f"   ⚠️ No gas data found, returning UNK")
            return {
                "fault_type": MLDGAFaultStatus.UNK,
                "fault_name": "No Data",
                "zone_color": "#95A5A6",
                "probabilities": {},
                "top_3": [],
                "raw_values": {k: parameters.get(k, 0) for k in self.get_required_parameters()}
            }
        
        # Prepare features
        features = self._prepare_features(parameters)
        if features is None:
            return {
                "fault_type": MLDGAFaultStatus.UNK,
                "fault_name": "Feature Preparation Failed",
                "zone_color": "#95A5A6",
                "probabilities": {},
                "top_3": [],
                "raw_values": {k: parameters.get(k, 0) for k in self.get_required_parameters()}
            }
        
        try:
            # Make prediction
            features_2d = features.reshape(1, -1)
            
            # Get probabilities
            all_probabilities = self._model.predict_proba(features_2d)[0]
            
            # Get predicted class
            encoded_prediction = np.argmax(all_probabilities)
            predicted_fault = self._label_encoder.classes_[encoded_prediction]
            
            # Create probability dictionary
            fault_classes = self._label_encoder.classes_
            probability_dict = {}
            for i, fault_class in enumerate(fault_classes):
                probability_dict[fault_class] = float(all_probabilities[i])
            
            # Get top 3 predictions
            sorted_probs = sorted(probability_dict.items(), key=lambda x: x[1], reverse=True)
            top_3 = [
                {"fault": fault, "probability": prob, "percentage": f"{prob:.1%}"}
                for fault, prob in sorted_probs[:3]
            ]
            
            # Map fault type to our status
            fault_type = predicted_fault if predicted_fault in MLDGAFaultStatus.ZONE_NAMES else MLDGAFaultStatus.UNK
            fault_name = MLDGAFaultStatus.ZONE_NAMES.get(fault_type, "Unknown")
            zone_color = MLDGAFaultStatus.ZONE_COLORS.get(fault_type, "#95A5A6")
            
            print(f"   ✅ Predicted fault: {fault_type} - {fault_name}")
            print(f"   📊 Top 3: {top_3}")
            
            return {
                "fault_type": fault_type,
                "fault_name": fault_name,
                "zone_color": zone_color,
                "probabilities": probability_dict,
                "top_3": top_3,
                "predicted_class": predicted_fault,
                "confidence": top_3[0]["probability"] if top_3 else 0,
                "raw_values": {k: parameters.get(k, 0) for k in self.get_required_parameters()}
            }
            
        except Exception as e:
            print(f"   ❌ Error during prediction: {e}")
            import traceback
            traceback.print_exc()
            return {
                "fault_type": MLDGAFaultStatus.UNK,
                "fault_name": "Prediction Error",
                "zone_color": "#95A5A6",
                "probabilities": {},
                "top_3": [],
                "error": str(e),
                "raw_values": {k: parameters.get(k, 0) for k in self.get_required_parameters()}
            }
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate ML-based DGA predictions for multiple samples"""
        print(f"\n📦 MLDGAAlgorithm.calculate_batch() called with {len(samples)} samples")
        results = []
        
        # Double check if model is loaded
        if self._model is None and os.path.exists(self.model_path):
            print(f"   🔄 Model is None but file exists. Reloading...")
            self._load_models()
        
        if not self.is_available():
            print(f"   ⚠️ ML Model not available for batch processing")
            print(f"   📍 self._model: {self._model}")
            print(f"   📍 self._label_encoder: {self._label_encoder}")
            print(f"   📍 self.model_path: {self.model_path}")
            print(f"   📍 File exists: {os.path.exists(self.model_path)}")
            for idx, sample in enumerate(samples):
                results.append({
                    "fault_type": MLDGAFaultStatus.UNK,
                    "fault_name": "Model Not Available",
                    "zone_color": "#95A5A6",
                    "probabilities": {},
                    "top_3": [],
                    "id": sample.get('id'),
                    "sample_date": sample.get('sample_date')
                })
            return results
        
        for idx, sample in enumerate(samples):
            print(f"\n   --- Sample {idx + 1} ---")
            gas_data = sample.get('gas_data', {})
            print(f"   Gas data: {gas_data}")
            
            params = {
                'h2': gas_data.get('h2', 0),
                'ch4': gas_data.get('ch4', 0),
                'c2h6': gas_data.get('c2h6', 0),
                'c2h4': gas_data.get('c2h4', 0),
                'c2h2': gas_data.get('c2h2', 0),
                'co': gas_data.get('co', 0),
                'co2': gas_data.get('co2', 0)
            }
            
            result = self.calculate(params)
            result['id'] = sample.get('id')
            result['sample_date'] = sample.get('sample_date')
            results.append(result)
        
        print(f"\n📦 Returning {len(results)} results")
        return results