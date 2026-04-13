from fastapi.testclient import TestClient
from src.agents.prd_writer import app

client = TestClient(app)

def test_prd_writer():
    response = client.post("/write-prd", json={
        "lead_id": "1", "lead_name": "Test", "status": "PROFILED", 
        "needs_analysis": "Dashboard"
    })
    data = response.json()
    assert data["status"] == "PRD_WRITTEN"
    assert "PRD: Dashboard" in data["prd_content"]
