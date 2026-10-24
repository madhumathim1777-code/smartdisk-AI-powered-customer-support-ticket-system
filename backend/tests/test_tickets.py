def get_auth_header(client, email="customer@test.com", password="password123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_and_view_ticket(client):
    headers = get_auth_header(client, "customer@test.com")
    # Create ticket
    create_res = client.post("/api/tickets", headers=headers, json={
        "title": "Cannot login with 2FA",
        "description": "I get error code 403 whenever entering the authenticator 6-digit PIN code."
    })
    assert create_res.status_code == 201
    ticket = create_res.json()
    assert ticket["title"] == "Cannot login with 2FA"
    assert ticket["status"] == "open"
    assert ticket["ticket_number"].startswith("TICK-")

    # View ticket list
    list_res = client.get("/api/tickets", headers=headers)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert any(t["id"] == ticket["id"] for t in data["items"])

def test_internal_note_isolation(client):
    # Customer creates ticket
    cust_headers = get_auth_header(client, "customer@test.com")
    create_res = client.post("/api/tickets", headers=headers_to_dict := cust_headers, json={
        "title": "Account locked inquiry",
        "description": "Please help unlock my account after 5 failed attempts."
    })
    ticket_id = create_res.json()["id"]

    # Agent adds an internal note
    agent_headers = get_auth_header(client, "agent@test.com")
    msg_res = client.post(f"/api/tickets/{ticket_id}/messages", headers=agent_headers, json={
        "message": "SUSPICIOUS ACTIVITY: IP location differs from registered country.",
        "is_internal": True
    })
    assert msg_res.status_code == 200

    # Agent viewing ticket sees the internal note
    agent_view = client.get(f"/api/tickets/{ticket_id}", headers=agent_headers).json()
    internal_msgs = [m for m in agent_view["messages"] if m["is_internal"]]
    assert len(internal_msgs) == 1

    # Customer viewing ticket MUST NOT see the internal note
    cust_view = client.get(f"/api/tickets/{ticket_id}", headers=cust_headers).json()
    for m in cust_view["messages"]:
        assert m["is_internal"] is False
        assert "SUSPICIOUS" not in m["message"]
