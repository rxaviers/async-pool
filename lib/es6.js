let assert, assertType;
const shouldAssert = process.env.NODE_ENV === "development";

if (shouldAssert) {
  ({ assert, assertType } = require("yaassertion"));
}

function asyncPool(poolLimit, array, iteratorFn, retryLimit=0) {
  if (shouldAssert) {
      try {
          assertType(poolLimit, 'poolLimit', ['number'])
          assertType(array, 'array', ['array'])
          assertType(iteratorFn, 'iteratorFn', ['function'])
      } catch (error) {
          return Promise.reject(error)
      }
  }

  let i = 0
  const ret = []
  const executing = []
  const enqueue = function () {
      if (i === array.length) {
          return Promise.resolve()
      }
      const item = array[i++]
      const cur = () => iteratorFn(item, array)
      const p = Promise.resolve().then(cur)
      let retryCount = 0

      let r = Promise.resolve()
      const e = p
          .then((r) => {
              executing.splice(executing.indexOf(e), 1)
              return r
          })
          .catch((error) => {
              if (retry) {
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
              r = Promise.race(executing)
          }
      } else {
          ret.push(e)
      }

      return r.then(() => enqueue())
  }
  return enqueue().then(() => Promise.all(ret))
}

module.exports = asyncPool;
