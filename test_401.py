import requests

print("Testing 401 response headers...")
resp = requests.post("http://localhost:8080/submissions", headers={"Authorization": "Bearer badtoken"}, data={"foo": "bar"})
print("Status:", resp.status_code)
print("Headers:", resp.headers)
print("Body:", resp.text)
