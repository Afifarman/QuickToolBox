const FUNCTIONS = Object.freeze({
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt,
  abs: Math.abs, log: Math.log, log10: Math.log10,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
});
const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E });

/** Safe arithmetic parser: no eval, Function, property access, or arbitrary JavaScript. Trigonometric functions use radians. */
export function evaluateMathExpression(input) {
  const source = String(input ?? '').trim().toLowerCase();
  if (!source || source.length > 200) throw new Error('Enter an expression (maximum 200 characters).');
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+\-*/%^]/g) || [];
  if (tokens.join('') !== source.replace(/\s+/g, '')) throw new Error('Expression contains unsupported characters.');
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];

  function primary() {
    const token = take();
    if (token === undefined) throw new Error('Incomplete expression.');
    if (token === '(') {
      const value = expression();
      if (take() !== ')') throw new Error('Missing closing parenthesis.');
      return value;
    }
    if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(token)) return Number(token);
    if (Object.hasOwn(CONSTANTS, token)) return CONSTANTS[token];
    if (Object.hasOwn(FUNCTIONS, token)) {
      if (take() !== '(') throw new Error('Functions must use parentheses, e.g. sqrt(9).');
      const value = expression();
      if (take() !== ')') throw new Error('Missing closing parenthesis.');
      if (token === 'sqrt' && value < 0) throw new Error('Square root of a negative number is not real.');
      return FUNCTIONS[token](value);
    }
    throw new Error('Unsupported value or function.');
  }
  function power() {
    const left = primary();
    if (peek() === '^') { take(); return left ** unary(); }
    return left;
  }
  function unary() {
    if (peek() === '+') { take(); return unary(); }
    if (peek() === '-') { take(); return -unary(); }
    return power();
  }
  function term() {
    let value = unary();
    while (['*', '/', '%'].includes(peek())) {
      const op = take(), right = unary();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Cannot divide by zero.');
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  }
  function expression() {
    let value = term();
    while (peek() === '+' || peek() === '-') {
      const op = take(), right = term();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = expression();
  if (index !== tokens.length) throw new Error('Unexpected characters after the expression.');
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number.');
  return result;
}
