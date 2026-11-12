export function evaluateSafeMath(input) {
  const source = String(input).trim();
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|(?:[a-zA-Z]+)|(?:\*\*|[()+\-*/%^])/g) || [];
  if (!tokens.length || tokens.join('') !== source.replace(/\s+/g, '')) throw new Error('Invalid expression');
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const expect = (token) => { if (take() !== token) throw new Error('Invalid expression'); };
  const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs, log: Math.log10, ln: Math.log, floor: Math.floor, ceil: Math.ceil, round: Math.round };
  function primary() {
    const token = take();
    if (token === '(') { const value = expression(); expect(')'); return value; }
    if (token && (/^\d/.test(token) || token.startsWith('.'))) return Number(token);
    if (token && /^[a-zA-Z]+$/.test(token)) {
      const name = token.toLowerCase();
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;
      if (!functions[name]) throw new Error('Unsupported function');
      expect('('); const value = expression(); expect(')');
      return functions[name](value);
    }
    throw new Error('Invalid expression');
  }
  function unary() {
    if (peek() === '+') { take(); return unary(); }
    if (peek() === '-') { take(); return -unary(); }
    return power();
  }
  function power() { let value = primary(); if (peek() === '^' || peek() === '**') { take(); value = value ** unary(); } return value; }
  function term() {
    let value = unary();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = take(), right = unary();
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  }
  function expression() {
    let value = term();
    while (peek() === '+' || peek() === '-') { const op = take(), right = term(); value = op === '+' ? value + right : value - right; }
    return value;
  }
  const result = expression();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid result');
  return result;
}
