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
