from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class HerzbergAnalysis(BaseModel):
    motivators: List[str] = []
    hygiene_issues: List[str] = []

class EmployeeTwin(BaseModel):
    name: str
    maslow_level: str = "Unknown"
    herzberg: HerzbergAnalysis = Field(default_factory=HerzbergAnalysis)
    management_style: str = "Neutral"
    equity_concerns: bool = False
    burnout_risk: float = 0.0
    career_goals: List[str] = []
    interaction_memory: List[str] = []
