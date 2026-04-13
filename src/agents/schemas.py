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
