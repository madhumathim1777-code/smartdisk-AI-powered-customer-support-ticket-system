def test_register_customer(client):
    res = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "Password123!"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "customer"

def test_login_success(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
