# /// script
# requires-python = "==3.11.*"
# dependencies = [
#   "codewords-client==0.4.6",
#   "fastapi==0.116.1"
# ]
# [tool.env-checker]
# env_vars = [
#   "PORT=8000",
#   "LOGLEVEL=INFO",
#   "CODEWORDS_API_KEY",
#   "CODEWORDS_RUNTIME_URI"
# ]
# ///

from typing import Literal

from codewords_client import logger, run_service
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator


def create_personalized_greeting(greeting: str, name: str) -> str:
    """Simple toy function that combines greeting and name with personalization."""
    logger.info("Creating personalized greeting", greeting=greeting, name=name)

    if greeting == "Ahoy":
        return f"{greeting}, {name}! Welcome aboard!"
    elif greeting == "Howdy":
        return f"{greeting}, {name}! How's it going?"
    return f"{greeting}, {name}! Nice to meet you!"

# -------------------------
# FastAPI Application
# -------------------------
app = FastAPI(
    title="CodeWords Workflow Skeleton",
    description="A minimal template for creating new CodeWords microservices.",
    version="1.0.0",
)

class ExampleRequest(BaseModel):
    greeting: Literal["Hello", "Howdy", "Ahoy"] = Field(
        default="Hello",
        description="The type of greeting to use",
        json_schema_extra={"enum": ["Hello", "Howdy", "Ahoy"]}
    )
    name: str = Field(..., description="The name to greet", example="World", min_length=2, max_length=50)

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate and clean the name field."""
        name = v.strip()
        if not name.replace(' ', '').replace('-', '').replace('\'', '').isalpha():
            raise ValueError("Name must contain only letters, spaces, hyphens, and apostrophes")
        return name.title()  # Capitalize properly

class ExampleResponse(BaseModel):
    message: str = Field(..., description="The personalized greeting message.")
    greeting_type: str = Field(..., description="The type of greeting that was used.")

@app.post("/", response_model=ExampleResponse)
async def example_endpoint(request: ExampleRequest):
    """
    An example endpoint that demonstrates input validation and service logic.

    - **greeting**: Choose from Hello, Howdy, or Ahoy (default: Hello)
    - **name**: A name to greet (2-50 characters, letters/spaces/hyphens/apostrophes only)

    Returns a personalized greeting message based on the greeting type.
    """
    logger.info("Processing greeting request", greeting=request.greeting, name=request.name)

    # Use our service logic function
    message = create_personalized_greeting(request.greeting, request.name)

    return ExampleResponse(message=message, greeting_type=request.greeting)

if __name__ == "__main__":
    run_service(app)
