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
