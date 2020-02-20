let assert, assertType;
const shouldAssert = process.env.NODE_ENV === "development";

if (shouldAssert) {
  ({ assert, assertType } = require("yaassertion"));
}

async function asyncPool(poolLimit, array, iteratorFn) {
  if (shouldAssert) {
    assertType(poolLimit, "poolLimit", ["number"]);
    assertType(array, "array", ["array"]);
    assertType(iteratorFn, "iteratorFn", ["function"]);
  }
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

module.exports = asyncPool;
