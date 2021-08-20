let assert, assertType;
const shouldAssert = process.env.NODE_ENV === "development";

if (shouldAssert) {
  ({ assert, assertType } = require("yaassertion"));
}

async function asyncPool(poolLimit, array, iteratorFn, retryLimit = 0) {
  if (shouldAssert) {
    assertType(poolLimit, "poolLimit", ["number"]);
    assertType(array, "array", ["array"]);
    assertType(iteratorFn, "iteratorFn", ["function"]);
  }
  
  const ret = []
  const executing = []
  for (const item of array) {
      const cur = () => iteratorFn(item, array)
      const p = Promise.resolve().then(cur)
      let retryCount = 0
      const e = p
          .then((r) => {
              executing.splice(executing.indexOf(e), 1)
              return r
          })
          .catch((error) => {
              if (retryLimit) {
                  retryCount++
                  const initiateRetry = (promiseFn, retryCount) => {
                      return promiseFn()
                          .then((r) => {
                              executing.splice(executing.indexOf(e), 1)
                              return r
                          })
                          .catch((error) => {
                              if (retryCount === retryLimit) {
                                  return Promise.reject(error)
                              } else {
                                  retryCount++
                                  return initiateRetry(promiseFn, retryCount)
                              }
                          })
                  }
                  return initiateRetry(cur, retryCount)
              } else {
                  return Promise.reject(error)
              }
          })
      if (poolLimit <= array.length) {
          executing.push(e)
          ret.push(e)

          if (executing.length >= poolLimit) {
              await Promise.race(executing)
          }
      } else {
          ret.push(e)
      }
  }
  return Promise.all(ret)
}

module.exports = asyncPool;
