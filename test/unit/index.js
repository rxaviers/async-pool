const es6AsyncPool = require("../../lib/es6");
const es7AsyncPool = require("../../lib/es7");
const { rejects } = require("assert");
const { expect } = require("chai");

describe("asyncPool", function() {
  for (const [title, asyncPool] of [
    ["ES6 support", es6AsyncPool],
    ["ES7 support", es7AsyncPool]
  ]) {
    describe(title, function() {
      describe('should assert parameters when NODE_ENV === "development"', function() {
        it("", function() {
          return expect(asyncPool()).to.eventually.be.rejectedWith(
            "Parameter `poolLimit` must be a number"
          );
        });

        it("", function() {
          return expect(asyncPool(2)).to.eventually.be.rejectedWith(
            "Parameter `array` must be a array"
          );
        });

        it("", function() {
          return expect(asyncPool(2, [1])).to.eventually.be.rejectedWith(
            "Parameter `iteratorFn` must be a function"
          );
        });
      });

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

      it("rejects on error with pool limit effective", async function() {
        const results = [];
        const timeout = i =>
          new Promise((resolve, reject) =>
            setTimeout(() => {
              results.push(i);

              if (i === 300) {
                reject(new Error("Oops"));
              } else {
                resolve();
              }
            }, i)
          );
        await rejects(asyncPool(2, [100, 500, 300, 200], timeout));
      });

      it("rejects on error when pool bigger than needed", async function() {
        const results = [];
        const timeout = i =>
          new Promise((resolve, reject) =>
            setTimeout(() => {
              results.push(i);

              if (i === 300) {
                reject(new Error("Oops"));
              } else {
                resolve();
              }
            }, i)
          );
        await rejects(asyncPool(5, [100, 500, 300, 200], timeout));

        // check console - no UnhandledPromiseRejectionWarning should appear
      });
    });
  }
});
