let assert, assertType;
if (process.env.NODE_ENV === "development") {
  ({ assert, assertType } = require("yaassertion"));
}

async function asyncPool(poolLimit, array, iteratorFn) {
  if (process.env.NODE_ENV === "development") {
    assertType(poolLimit, "poolLimit", ["number"]);
    assertType(array, "array", ["array"]);
    assertType(iteratorFn, "iteratorFn", ["function"]);
    assert(array.length, "Parameter `array` must have at least one item");
  }
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);
    if (executing.length >= poolLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

module.exports = asyncPool;
