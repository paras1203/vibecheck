"""
Helper script to convert Firebase service account JSON to TOML format
Run this script and it will prompt you for your Firebase JSON file path
"""
import json
import os

def convert_firebase_json_to_toml(json_file_path):
    """Read Firebase JSON and convert to TOML format for secrets.toml"""
    try:
        # Read the JSON file
        with open(json_file_path, 'r', encoding='utf-8') as f:
            firebase_data = json.load(f)
        
        # Ensure private_key has escaped newlines
        if 'private_key' in firebase_data:
            firebase_data['private_key'] = firebase_data['private_key'].replace('\n', '\\n')
        
        # Convert to JSON string with proper formatting
        json_string = json.dumps(firebase_data, indent=2)
        
        # Create TOML content
        toml_content = f'''# Firebase Service Account Key
# Auto-generated from: {json_file_path}

FIREBASE_KEY = """
{json_string}
'''
        
        # Write to .streamlit/secrets.toml
        os.makedirs('.streamlit', exist_ok=True)
        secrets_path = '.streamlit/secrets.toml'
        
        with open(secrets_path, 'w', encoding='utf-8') as f:
            f.write(toml_content)
        
        print(f"✅ Successfully converted Firebase key to TOML format!")
        print(f"📁 Saved to: {os.path.abspath(secrets_path)}")
        print("\n⚠️  IMPORTANT: Make sure .streamlit/secrets.toml is in your .gitignore!")
        
        return secrets_path
        
    except FileNotFoundError:
        print(f"❌ Error: File not found: {json_file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON file: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Firebase JSON to TOML Converter")
    print("=" * 60)
    print()
    
    # Prompt for JSON file path
    json_path = input("Enter the path to your Firebase service account JSON file: ").strip().strip('"')
    
    if not json_path:
        print("❌ No file path provided. Exiting.")
    else:
        convert_firebase_json_to_toml(json_path)




