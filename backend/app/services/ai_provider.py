import asyncio
import os
import random
from dataclasses import dataclass

from app.config import load_environment

load_environment()


@dataclass
class GeneratedResult:
    text: str


class AIProvider:
    name = "base"

    async def generate(self, prompt: str) -> GeneratedResult:
        raise NotImplementedError


class MockAIProvider(AIProvider):
    name = "mock"

    def __init__(self) -> None:
        self.failure_rate = float(os.getenv("MOCK_AI_FAILURE_RATE", "0.15"))
        self.min_latency = float(os.getenv("MOCK_AI_MIN_LATENCY_SECONDS", "2"))
        self.max_latency = float(os.getenv("MOCK_AI_MAX_LATENCY_SECONDS", "5"))

    async def generate(self, prompt: str) -> GeneratedResult:
        await asyncio.sleep(random.uniform(self.min_latency, self.max_latency))
        if random.random() < self.failure_rate:
            raise RuntimeError("Mock AI generation failed. The room is still active.")

        concept = prompt.strip().rstrip(".")
        return GeneratedResult(
            text=(
                f"Campaign Concept: {concept}.\n\n"
                "Hero Line: Turn the impossible brief into a signal people can wear.\n\n"
                "Execution: Launch with a 10-second teaser, a creator-led remix challenge, "
                "street-level projection ads, and a limited drop that rewards the boldest fan prompt.\n\n"
                "Why it wins: It gives the audience a visual world, a social mechanic, and a simple reason "
                "to share the idea before the product ever appears."
            )
        )


def get_ai_provider() -> AIProvider:
    provider = os.getenv("AI_PROVIDER", "mock").lower()
    if provider != "mock":
        raise RuntimeError(f"AI provider '{provider}' is not configured. Use AI_PROVIDER=mock.")
    return MockAIProvider()
