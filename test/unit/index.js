const es6AsyncPool = require("../../lib/es6");
const es7AsyncPool = require("../../lib/es7");
const { expect } = require("chai");

describe("asyncPool", function() {
  for (const [title, asyncPool] of [
    ["ES6 support", es6AsyncPool],
    ["ES7 support", es7AsyncPool]
  ]) {
    describe(title, function() {
      it("only runs as many promises in parallel as given by the pool limit", async function() {
        const results = [];
        const timeout = i =>
          new Promise(resolve =>
            setTimeout(() => {
              results.push(i);
              resolve();
            }, i)
          );
        await asyncPool(2, [100, 500, 300, 200], timeout);
        expect(results).to.deep.equal([100, 300, 500, 200]);
      });

      it("runs all promises in parallel when the pool is bigger than needed", async function() {
        const results = [];
        const timeout = i =>
          new Promise(resolve =>
            setTimeout(() => {
              results.push(i);
              resolve();
            }, i)
          );
        await asyncPool(5, [100, 500, 300, 200], timeout);
        expect(results).to.deep.equal([100, 200, 300, 500]);
      });

      it("rejects on error (but does not leave unhandled rejections) (1/2)", async function() {
        const timeout = _ => Promise.reject();
        return expect(
          asyncPool(5, [100, 500, 300, 200], timeout)
        ).to.be.rejected;
        // check console - no UnhandledPromiseRejectionWarning should appear
      });

      it("rejects on error (but does not leave unhandled rejections) (2/2)", async function() {
        return expect(
          asyncPool(
            2,
            [0, 1, 2],
            (i, a) =>
              i < a.length - 1 ? Promise.resolve(i) : Promise.reject(i)
          )
        ).to.be.rejected;
        // check console - no UnhandledPromiseRejectionWarning should appear
      });

      it("rejects as soon as first promise rejects", async function() {
        const startedTasks = [];
        const finishedTasks = [];
        const timeout = i => {
          startedTasks.push(i);
          return new Promise((resolve, reject) =>
            setTimeout(() => {
              if (i === 300) {
                reject(new Error("Oops"));
              } else {
                finishedTasks.push(i);
                resolve();
              }
            }, i)
          );
        };

        const testResult = await expect(
          asyncPool(2, [100, 500, 300, 200], timeout)
        ).to.be.rejected;

        expect(startedTasks).to.deep.equal([100, 500, 300]);
        expect(finishedTasks).to.deep.equal([100]);

        // tasks started before the error will continue, though - just wait a bit
        await new Promise(resolve => setTimeout(() => resolve(), 500));
        expect(startedTasks).to.deep.equal([100, 500, 300]);
        expect(finishedTasks).to.deep.equal([100, 500]);

        return testResult;
      });
    });
  }
});
