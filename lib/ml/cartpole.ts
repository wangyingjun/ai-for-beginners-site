/**
 * Classic CartPole physics + simple policy-gradient style learner (lesson 22).
 * Pure TypeScript — no gym dependency.
 */

export type CartState = {
  x: number; // cart position
  xDot: number;
  theta: number; // pole angle from vertical (rad)
  thetaDot: number;
};

export type CartAction = -1 | 1; // left / right force

export const CART = {
  gravity: 9.8,
  massCart: 1.0,
  massPole: 0.1,
  length: 0.5, // half pole length
  forceMag: 10.0,
  tau: 0.02,
  xThreshold: 2.4,
  thetaThreshold: (12 * Math.PI) / 180,
};

export function resetCart(rng = Math.random): CartState {
  return {
    x: (rng() - 0.5) * 0.1,
    xDot: 0,
    theta: (rng() - 0.5) * 0.1,
    thetaDot: 0,
  };
}

export function stepCart(
  state: CartState,
  action: CartAction,
): { state: CartState; reward: number; done: boolean } {
  const { gravity, massCart, massPole, length, forceMag, tau, xThreshold, thetaThreshold } =
    CART;
  const force = action * forceMag;
  const cos = Math.cos(state.theta);
  const sin = Math.sin(state.theta);
  const totalMass = massCart + massPole;
  const temp =
    (force + massPole * length * state.thetaDot * state.thetaDot * sin) / totalMass;
  const thetaAcc =
    (gravity * sin - cos * temp) /
    (length * (4 / 3 - (massPole * cos * cos) / totalMass));
  const xAcc = temp - (massPole * length * thetaAcc * cos) / totalMass;

  const next: CartState = {
    x: state.x + tau * state.xDot,
    xDot: state.xDot + tau * xAcc,
    theta: state.theta + tau * state.thetaDot,
    thetaDot: state.thetaDot + tau * thetaAcc,
  };

  const done =
    next.x < -xThreshold ||
    next.x > xThreshold ||
    next.theta < -thetaThreshold ||
    next.theta > thetaThreshold;

  return { state: next, reward: done ? 0 : 1, done };
}

/** Linear policy: action = sign(w · features). features = [x, xDot, theta, thetaDot, 1] */
export type Policy = { weights: number[] };

export function createPolicy(rng = Math.random): Policy {
  return {
    weights: Array.from({ length: 5 }, () => (rng() - 0.5) * 0.5),
  };
}

function features(s: CartState): number[] {
  return [s.x, s.xDot, s.theta, s.thetaDot, 1];
}

export function act(policy: Policy, state: CartState, stochastic = false, rng = Math.random): CartAction {
  const f = features(state);
  let logit = 0;
  for (let i = 0; i < f.length; i++) logit += policy.weights[i]! * f[i]!;
  if (stochastic) {
    const p = 1 / (1 + Math.exp(-logit));
    return rng() < p ? 1 : -1;
  }
  return logit >= 0 ? 1 : -1;
}

export type EpisodeResult = {
  steps: number;
  trajectory: Array<{ state: CartState; action: CartAction; reward: number }>;
};

export function runEpisode(
  policy: Policy,
  maxSteps = 500,
  stochastic = true,
  rng = Math.random,
): EpisodeResult {
  let state = resetCart(rng);
  const trajectory: EpisodeResult["trajectory"] = [];
  for (let t = 0; t < maxSteps; t++) {
    const action = act(policy, state, stochastic, rng);
    const { state: next, reward, done } = stepCart(state, action);
    trajectory.push({ state, action, reward });
    state = next;
    if (done) break;
  }
  return { steps: trajectory.length, trajectory };
}

/**
 * REINFORCE-ish update: reward-to-go × action direction on features.
 * Keeps the demo tiny and dependency-free.
 */
export function reinforceUpdate(
  policy: Policy,
  episode: EpisodeResult,
  lr = 0.01,
): Policy {
  const weights = [...policy.weights];
  const T = episode.trajectory.length;
  let G = 0;
  const returns: number[] = new Array(T);
  for (let t = T - 1; t >= 0; t--) {
    G = episode.trajectory[t]!.reward + 0.99 * G;
    returns[t] = G;
  }
  const mean = returns.reduce((a, b) => a + b, 0) / (T || 1);
  for (let t = 0; t < T; t++) {
    const { state, action } = episode.trajectory[t]!;
    const f = features(state);
    const adv = returns[t]! - mean;
    for (let i = 0; i < weights.length; i++) {
      weights[i]! += lr * adv * action * f[i]!;
    }
  }
  return { weights };
}

/** Heuristic baseline: push under the falling pole. */
export function heuristicAction(state: CartState): CartAction {
  return state.theta + 0.25 * state.thetaDot > 0 ? 1 : -1;
}
