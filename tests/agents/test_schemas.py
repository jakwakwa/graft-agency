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
