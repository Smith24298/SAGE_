from pymongo import MongoClient
import os
import ssl
import certifi

# MongoDB Atlas connection configuration
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    print("✗ MONGO_URI environment variable not set")
    client = None
    db = None
    employees = None
else:
    try:
        # MongoDB Atlas requires SSL/TLS
        # Use certifi to get CA bundle for certificate verification
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            retryWrites=True,
            tlsCaFile=certifi.where()  # Use certifi's CA bundle for MongoDB Atlas
        )
        # Test the connection
        client.admin.command('ping')
        print("✓ MongoDB Atlas connection successful")
        db = client["hr_ai"]
        employees = db["digital_twins"]
    except Exception as e:
        print(f"✗ MongoDB Atlas connection failed: {e}")
        print("Debug: Ensure MONGO_URI is correct and includes retryWrites=true")
        client = None
        db = None
        employees = None