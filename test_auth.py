import requests
import json

base_url = "http://localhost:8080"

print("Registering...")
resp = requests.post(f"{base_url}/auth/register", json={
    "name": "Test User",
    "email": "test@test.com",
    "team": "Test Team",
    "password": "password123"
})
print("Register response:", resp.status_code, resp.text)
if resp.status_code in [201, 409]:
    print("Logging in...")
    resp = requests.post(f"{base_url}/auth/login", json={
        "email": "test@test.com",
        "password": "password123"
    })
    print("Login response:", resp.status_code, resp.text)
    if resp.status_code == 200:
        token = resp.json()["token"]
        print("Fetching /auth/me...")
        resp2 = requests.get(f"{base_url}/auth/me", headers={"Authorization": f"Bearer {token}"})
        print("/auth/me response:", resp2.status_code, resp2.text)

        print("Uploading file...")
        resp3 = requests.post(f"{base_url}/submissions", headers={"Authorization": f"Bearer {token}"}, files={"file": ("test.txt", b"hello world")}, data={"teamName": "Test Team"})
        print("/submissions response:", resp3.status_code, resp3.text)
