let assert, assertType;
if (process.env.NODE_ENV === "development") {
  ({ assert, assertType } = require("yaassertion"));
}

function asyncPool(poolLimit, array, iteratorFn) {
  if (process.env.NODE_ENV === "development") {
    try {
      assertType(poolLimit, "poolLimit", ["number"]);
      assertType(array, "array", ["array"]);
      assertType(iteratorFn, "iteratorFn", ["function"]);
      assert(array.length, "Parameter `array` must have at least one item");
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
    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);
    let r = Promise.resolve();
    if (executing.length >= poolLimit) {
      r = Promise.race(executing);
    }
    return r.then(() => enqueue());
  };
  return enqueue().then(() => Promise.all(ret));
}

module.exports = asyncPool;
