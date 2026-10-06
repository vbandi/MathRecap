// Pure helpers for worksheet figures, shared by the server-side schema and the browser renderer.

const FUNCTIONS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs,
  ln: Math.log, log: Math.log10, lg: Math.log10, exp: Math.exp,
};
const CONSTANTS = { pi: Math.PI, e: Math.E };
// Longest first, so "exp" is not split into "e" + "x" + "p".
const KNOWN_NAMES = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS), "x"].sort((left, right) => right.length - left.length);
export const MAX_EXPRESSION_LENGTH = 200;

function splitName(run) {
  const names = [];
  let rest = run.toLowerCase();
  while (rest) {
    const name = KNOWN_NAMES.find((candidate) => rest.startsWith(candidate));
    if (!name) throw new Error(`Unknown name: ${run}`);
    names.push(name);
    rest = rest.slice(name.length);
  }
  return names;
}

function tokenize(source) {
  const normalized = source.replace(/[−–]/g, "-").replace(/[·×⋅]/g, "*").replace(/π/g, "pi").replace(/\*\*/g, "^");
  const tokens = [];
  let index = 0;
  while (index < normalized.length) {
    const rest = normalized.slice(index);
    const space = /^\s+/.exec(rest);
    const number = /^(?:\d+(?:[.,]\d+)?|[.,]\d+)/.exec(rest);
    const name = /^[a-z]+/i.exec(rest);
    if (space) index += space[0].length;
    else if (number) {
      tokens.push({ kind: "number", value: Number(number[0].replace(",", ".")) });
      index += number[0].length;
    } else if (name) {
      splitName(name[0]).forEach((value) => tokens.push({ kind: "name", value }));
      index += name[0].length;
    } else if ("+-*/^()".includes(rest[0])) {
      tokens.push({ kind: rest[0] });
      index += 1;
    } else throw new Error(`Unexpected character: ${rest[0]}`);
  }
  return tokens;
}

// Compiles a single-variable expression such as "2x^2 - 3", "sin(x)/x" or "sqrt(x+1)" into f(x).
// Supports + - * / ^, implicit multiplication, parentheses, pi, e and the functions above.
export function compileExpression(source) {
  if (typeof source !== "string" || !source.trim() || source.length > MAX_EXPRESSION_LENGTH) throw new Error("Invalid expression");
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const take = (kind) => {
    const token = tokens[position];
    if (!token || (kind && token.kind !== kind)) throw new Error(`Expected ${kind ?? "token"}`);
    position += 1;
    return token;
  };

  function sum() {
    let left = product();
    while (peek()?.kind === "+" || peek()?.kind === "-") {
      const operator = take().kind;
      const [first, second] = [left, product()];
      left = operator === "+" ? (x) => first(x) + second(x) : (x) => first(x) - second(x);
    }
    return left;
  }

  function product() {
    let left = signed();
    for (;;) {
      const kind = peek()?.kind;
      if (kind === "*" || kind === "/") {
        take();
        const [first, second] = [left, signed()];
        left = kind === "*" ? (x) => first(x) * second(x) : (x) => first(x) / second(x);
      } else if (kind === "number" || kind === "name" || kind === "(") {
        const [first, second] = [left, power()];
        left = (x) => first(x) * second(x);
      } else return left;
    }
  }

  function signed() {
    if (peek()?.kind === "-") {
      take();
      const operand = signed();
      return (x) => -operand(x);
    }
    if (peek()?.kind === "+") take();
    return power();
  }

  function power() {
    const base = primary();
    if (peek()?.kind !== "^") return base;
    take();
    const exponent = signed();
    return (x) => base(x) ** exponent(x);
  }

  function primary() {
    const token = take();
    if (token.kind === "number") return () => token.value;
    if (token.kind === "(") {
      const inner = sum();
      take(")");
      return inner;
    }
    if (token.kind !== "name") throw new Error(`Unexpected ${token.kind}`);
    if (token.value === "x") return (x) => x;
    if (token.value in CONSTANTS) return () => CONSTANTS[token.value];
    const apply = FUNCTIONS[token.value];
    take("(");
    const argument = sum();
    take(")");
    return (x) => apply(argument(x));
  }

  const evaluate = sum();
  if (position !== tokens.length) throw new Error("Unexpected trailing input");
  return evaluate;
}

export function isValidExpression(source) {
  try {
    compileExpression(source);
    return true;
  } catch {
    return false;
  }
}

// A 1, 2 or 5 times power-of-ten step giving at most maxTicks intervals.
export function niceStep(span, maxTicks = 10) {
  const raw = span / Math.max(1, maxTicks);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((multiple) => multiple * magnitude).find((step) => step >= raw * (1 - 1e-9));
}

export function tickValues(min, max, step) {
  const values = [];
  for (let index = Math.ceil(min / step - 1e-9); index * step <= max + step * 1e-9 && values.length < 500; index += 1) {
    values.push(Number((index * step).toFixed(10)));
  }
  return values;
}

export function formatNumber(value) {
  return String(Number(value.toFixed(6))).replace(".", ",").replace("-", "−");
}

// Drawing widths in px; figures are shown at 1:1 so labels keep their font size.
export const FIGURE_WIDTHS = { small: 300, medium: 440, large: 580 };
export const PLANE_PADDING = 28;

// By default uses the same unit on both axes so circles and angles stay true; a tall figure gets
// narrower instead, and only very flat or very narrow ranges are stretched. Data plots whose axes
// measure different quantities pass equalScale = false and get a fixed landscape frame.
export function planeLayout(xRange, yRange, maxWidth = FIGURE_WIDTHS.medium, equalScale = true) {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const padding = 2 * PLANE_PADDING;
  const maxHeight = Math.max(maxWidth, 360);
  let unit = (maxWidth - padding) / (xMax - xMin);
  if ((yMax - yMin) * unit + padding > maxHeight) unit = (maxHeight - padding) / (yMax - yMin);
  const width = equalScale ? Math.max(Math.min(200, maxWidth), (xMax - xMin) * unit + padding) : maxWidth;
  const height = equalScale ? Math.max(160, (yMax - yMin) * unit + padding) : Math.round(maxWidth * .62);
  const xUnit = (width - padding) / (xMax - xMin);
  const yUnit = (height - padding) / (yMax - yMin);
  return {
    width,
    height,
    xUnit,
    yUnit,
    toX: (x) => PLANE_PADDING + (x - xMin) * xUnit,
    toY: (y) => height - PLANE_PADDING - (y - yMin) * yUnit,
  };
}

// Samples f over the domain and splits the curve where it is undefined or jumps (e.g. at asymptotes).
export function sampleFunction(evaluate, [from, to], [yMin, yMax], samples = 400) {
  const ySpan = yMax - yMin;
  const pieces = [];
  let current = [];
  let previousY = null;
  for (let index = 0; index <= samples; index += 1) {
    const x = from + (to - from) * index / samples;
    const y = evaluate(x);
    const jumped = previousY !== null && Math.abs(y - previousY) > 2 * ySpan;
    if (!Number.isFinite(y) || jumped) {
      if (current.length > 1) pieces.push(current);
      current = [];
    }
    if (Number.isFinite(y)) current.push([x, Math.min(yMax + 10 * ySpan, Math.max(yMin - 10 * ySpan, y))]);
    previousY = Number.isFinite(y) ? y : null;
  }
  if (current.length > 1) pieces.push(current);
  return pieces;
}
