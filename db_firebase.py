import firebase_admin
from firebase_admin import credentials, firestore
import streamlit as st
import json

# Initialize Firebase App (Singleton check)
db = None
if not firebase_admin._apps:
    try:
        # Load credentials from Streamlit secrets
        # Handle nested text_key structure from secrets.toml
        if hasattr(st, 'secrets') and 'FIREBASE_KEY' in st.secrets:
            firebase_secret = st.secrets["FIREBASE_KEY"]
            # Check if it's nested (has text_key key)
            if isinstance(firebase_secret, dict) and 'text_key' in firebase_secret:
                key_dict = json.loads(firebase_secret["text_key"])
            elif isinstance(firebase_secret, str):
                key_dict = json.loads(firebase_secret)
            else:
                key_dict = firebase_secret
            
            cred = credentials.Certificate(key_dict)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
        else:
            print("[WARNING] FIREBASE_KEY not found in Streamlit secrets. Firestore operations will be disabled.")
    except Exception as e:
        print(f"[ERROR] Firebase initialization failed: {e}")
else:
    db = firestore.client()

def save_scan(url, audit_data, score):
    """Saves scan to Firestore 'scans' collection."""
    if db is None:
        print("[WARNING] Firestore not initialized. Scan not saved.")
        return None
    try:
        doc_ref = db.collection("scans").document()
        doc_ref.set({
            "url": url,
            "audit_json": audit_data,
            "overall_score": score,
            "created_at": firestore.SERVER_TIMESTAMP,
            "is_paid": False
        })
        return doc_ref.id
    except Exception as e:
        print(f"Firestore Error: {e}")
        return None

