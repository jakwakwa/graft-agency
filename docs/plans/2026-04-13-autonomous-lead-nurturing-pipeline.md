# Autonomous Lead Engagement Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an end-to-end autonomous agent workflow to research leads, discover needs, generate PRDs, build viable prototypes via an async handoff to Stitch/builder agents, deploy, and email payment options.

**Architecture:** A set of asynchronous Python microservices using FastAPI and `codewords-client` (building on `codework.py`). Instead of a synchronous CLI MCP bottleneck, the system uses an event-driven webhook approach where specialized agents (Profiler, PRD Writer, Builder Orchestrator, Sales) process data and trigger the next step.

**Tech Stack:** Python 3.11, FastAPI, CodeWords Client, Pytest, httpx (for webhook communication).

---

### Task 1: Foundation and Event Schema

**Files:**
- Create: `src/agents/schemas.py`
- Test: `tests/agents/test_schemas.py`

**Step 1: Write the failing test**

```python
# tests/agents/test_schemas.py
import pytest
from pydantic import ValidationError
from src.agents.schemas import LeadPipelineEvent

def test_pipeline_event_validation():
    # Should fail if missing required status
    with pytest.raises(ValidationError):
        LeadPipelineEvent(lead_id="123", lead_name="Acme Corp")
    
    # Should pass with valid inputs
    event = LeadPipelineEvent(lead_id="123", lead_name="Acme Corp", status="NEW")
    assert event.lead_id == "123"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/agents/test_schemas.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'src.agents.schemas'"

**Step 3: Write minimal implementation**

```python
# src/agents/schemas.py
from pydantic import BaseModel, Field
from typing import Optional

class LeadPipelineEvent(BaseModel):
    lead_id: str = Field(..., description="Unique identifier for the lead")
    lead_name: str = Field(..., description="Name of the prospect/lead")
    status: str = Field(..., description="Current status in the pipeline")
    needs_analysis: Optional[str] = None
    prd_content: Optional[str] = None
    prototype_url: Optional[str] = None
    payment_link: Optional[str] = None
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/agents/test_schemas.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/agents/test_schemas.py src/agents/schemas.py
git commit -m "feat: add base schema for autonomous lead pipeline"
```

---

### Task 2: Lead Research & Requirements Agent (Profiler)

**Files:**
- Create: `src/agents/profiler.py`
- Test: `tests/agents/test_profiler.py`

**Step 1: Write the failing test**

```python
# tests/agents/test_profiler.py
from fastapi.testclient import TestClient
from src.agents.profiler import app

client = TestClient(app)

def test_profiler_endpoint():
    response = client.post("/profile", json={"lead_id": "1", "lead_name": "TestCorp", "status": "NEW"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PROFILED"
    assert data["needs_analysis"] is not None
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/agents/test_profiler.py -v`
Expected: FAIL with "ModuleNotFoundError"

**Step 3: Write minimal implementation**

```python
# src/agents/profiler.py
from fastapi import FastAPI
from src.agents.schemas import LeadPipelineEvent
from codewords_client import run_service

app = FastAPI(title="Profiler Agent")

@app.post("/profile", response_model=LeadPipelineEvent)
async def profile_lead(event: LeadPipelineEvent):
    # Simulated agentic research & need finding
    event.status = "PROFILED"
    event.needs_analysis = f"Based on research, {event.lead_name} needs an AI automation dashboard."
    
    # In full implementation, we'd fire an async task to hit the next endpoint
    return event

if __name__ == "__main__":
    run_service(app)
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/agents/test_profiler.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/agents/test_profiler.py src/agents/profiler.py
git commit -m "feat: implement lead profiler agent endpoint"
```

---

### Task 3: PRD Writer Agent

**Files:**
- Create: `src/agents/prd_writer.py`
- Test: `tests/agents/test_prd_writer.py`

**Step 1: Write the failing test**

```python
# tests/agents/test_prd_writer.py
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
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/agents/test_prd_writer.py -v`
Expected: FAIL

**Step 3: Write minimal implementation**

```python
# src/agents/prd_writer.py
from fastapi import FastAPI, HTTPException
from src.agents.schemas import LeadPipelineEvent

app = FastAPI(title="PRD Writer Agent")

@app.post("/write-prd", response_model=LeadPipelineEvent)
async def write_prd(event: LeadPipelineEvent):
    if not event.needs_analysis:
        raise HTTPException(status_code=400, detail="Missing needs analysis")
    
    event.status = "PRD_WRITTEN"
    event.prd_content = f"# PRD: {event.needs_analysis}\n\nFeatures: 1. Dashboard\n2. Auth"
    return event
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/agents/test_prd_writer.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/agents/test_prd_writer.py src/agents/prd_writer.py
git commit -m "feat: implement PRD writer agent endpoint"
```

---

### Task 4: Handoff to Builder (Stitch) Orchestrator

**Files:**
- Create: `src/agents/builder_handoff.py`
- Test: `tests/agents/test_builder_handoff.py`

**Step 1: Write the failing test**

```python
# tests/agents/test_builder_handoff.py
from fastapi.testclient import TestClient
from src.agents.builder_handoff import app

client = TestClient(app)

def test_builder_handoff():
    response = client.post("/trigger-build", json={
        "lead_id": "1", "lead_name": "Test", "status": "PRD_WRITTEN", "prd_content": "Build xyz"
    })
    data = response.json()
    assert data["status"] == "PROTOTYPE_BUILT"
    assert data["prototype_url"] == "https://prototype-1.vercel.app"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/agents/test_builder_handoff.py -v`
Expected: FAIL

**Step 3: Write minimal implementation**

```python
# src/agents/builder_handoff.py
from fastapi import FastAPI, HTTPException
from src.agents.schemas import LeadPipelineEvent

app = FastAPI(title="Builder Orchestrator")

@app.post("/trigger-build", response_model=LeadPipelineEvent)
async def trigger_build(event: LeadPipelineEvent):
    if not event.prd_content:
        raise HTTPException(status_code=400, detail="Missing PRD content")
    
    # Simulates passing the prompt to Stitch/Vercel and awaiting result
    event.status = "PROTOTYPE_BUILT"
    event.prototype_url = f"https://prototype-{event.lead_id}.vercel.app"
    return event
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/agents/test_builder_handoff.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/agents/test_builder_handoff.py src/agents/builder_handoff.py
git commit -m "feat: implement builder handoff orchestrator"
```

---

### Task 5: Sales and Delivery Agent

**Files:**
- Create: `src/agents/sales.py`
Autonomous Lead Engagement Workflow
context7-auto-research
writing-plans
I'm using the writing-plans skill to create the implementation plan.

The implementation plan establishes an event-driven architecture using Python and FastAPI (building off your codewords skeleton). Each stage of the pipeline (Profiling, PRD creation, Builder handoff, Delivery) is separated into its own autonomous microservice endpoint. This enables standard async communication (like Webhooks or job queues) to pass the lead straight through from new all the way to deployed app.

Plan complete and saved to docs/plans/2026-04-13-autonomous-lead-nurturing-pipeline.md.

Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration 2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?

1
2026-04-13-autonomous-lead-nurturing-pipeline.md
executing-plans




























test_schemas.py
Generating...

- Test: `tests/agents/test_sales.py`

**Step 1: Write the failing test**

```python
# tests/agents/test_sales.py
from fastapi.testclient import TestClient
from src.agents.sales import app

client = TestClient(app)

def test_sales_delivery():
    response = client.post("/send-delivery", json={
        "lead_id": "1", "lead_name": "Test", "status": "PROTOTYPE_BUILT",
        "prototype_url": "https://test.vercel.app"
    })
    data = response.json()
    assert data["status"] == "DELIVERED"
    assert "stripe.com" in data["payment_link"]
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/agents/test_sales.py -v`
Expected: FAIL

**Step 3: Write minimal implementation**

```python
# src/agents/sales.py
from fastapi import FastAPI, HTTPException
from src.agents.schemas import LeadPipelineEvent

app = FastAPI(title="Sales Agent")

@app.post("/send-delivery", response_model=LeadPipelineEvent)
async def send_delivery(event: LeadPipelineEvent):
    if not event.prototype_url:
        raise HTTPException(status_code=400, detail="Missing prototype URL")
    
    # Simulate generating payment link and sending email
    event.payment_link = f"https://buy.stripe.com/test_{event.lead_id}"
    event.status = "DELIVERED"
    return event
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/agents/test_sales.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/agents/test_sales.py src/agents/sales.py
git commit -m "feat: implement sales and delivery agent"
```
