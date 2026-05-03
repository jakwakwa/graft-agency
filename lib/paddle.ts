import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const paddleEnvironments = ["sandbox", "production"] as const;

type PaddleEnvironmentName = (typeof paddleEnvironments)[number];

const paddleEnvironmentByName: Record<PaddleEnvironmentName, Environment> = {
  sandbox: Environment.sandbox,
  production: Environment.production,
};

export function resolvePaddleEnvironment(value = process.env.PADDLE_ENVIRONMENT): Environment {
  if (!value) return Environment.sandbox;

  if (value === "sandbox" || value === "production") {
    return paddleEnvironmentByName[value];
  }

  throw new Error(`Invalid PADDLE_ENVIRONMENT "${value}". Expected one of: ${paddleEnvironments.join(", ")}.`);
}

function getPaddleApiKey() {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is required to initialise Paddle.");
  }

  return apiKey;
}

export const paddle = new Paddle(getPaddleApiKey(), {
  environment: resolvePaddleEnvironment(),
});
