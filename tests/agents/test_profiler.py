from fastapi.testclient import TestClient
from src.agents.profiler import app

client = TestClient(app)

def test_profiler_endpoint():
    response = client.post("/profile", json={"lead_id": "1", "lead_name": "TestCorp", "status": "NEW"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PROFILED"
    assert data["needs_analysis"] is not None
