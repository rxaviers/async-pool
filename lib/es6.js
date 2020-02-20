let assert, assertType;
const shouldAssert = process.env.NODE_ENV === "development";

if (shouldAssert) {
  ({ assert, assertType } = require("yaassertion"));
}

function asyncPool(poolLimit, array, iteratorFn) {
  if (shouldAssert) {
    try {
      assertType(poolLimit, "poolLimit", ["number"]);
      assertType(array, "array", ["array"]);
      assertType(iteratorFn, "iteratorFn", ["function"]);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  let i = 0;
  const ret = [];
  const executing = [];
  const enqueue = function() {
    if (i === array.length) {
      return Promise.resolve();
    }
    const item = array[i++];
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    let r = Promise.resolve();

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        r = Promise.race(executing);
      }
    }

    return r.then(() => enqueue());
  };
  return enqueue().then(() => Promise.all(ret));
}

module.exports = asyncPool;
