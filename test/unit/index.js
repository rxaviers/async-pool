const asyncPool = require("../../lib/es9");
const { expect } = require("chai");

const timeout = i =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve(i);
    }, i)
  );

describe("asyncPool", function() {
  it("only runs as many promises in parallel as given by the pool limit", async function() {
    const gen = asyncPool(2, [10, 50, 30, 20], timeout);
    expect((await gen.next()).value).to.equal(10);
    expect((await gen.next()).value).to.equal(30);
    expect((await gen.next()).value).to.equal(50);
    expect((await gen.next()).value).to.equal(20);
  });

  it("runs all promises in parallel when the pool is bigger than needed", async function() {
    const gen = asyncPool(5, [10, 50, 30, 20], timeout);
    expect((await gen.next()).value).to.equal(10);
    expect((await gen.next()).value).to.equal(20);
    expect((await gen.next()).value).to.equal(30);
    expect((await gen.next()).value).to.equal(50);
  });

  it("runs all promises even if they are not promises", async function() {
    const gen = asyncPool(2, [10, 50, 30, 20], x => x);
    expect((await gen.next()).value).to.equal(10);
    expect((await gen.next()).value).to.equal(50);
    expect((await gen.next()).value).to.equal(30);
    expect((await gen.next()).value).to.equal(20);
  });

  it("rejects on error (but does not leave unhandled rejections) (1/2)", async function() {
    const timeout = () => Promise.reject();
    const gen = asyncPool(5, [10, 50, 30, 20], timeout);
    await expect(gen.next()).to.be.rejected;
    // check console - no UnhandledPromiseRejectionWarning should appear
  });

  it("rejects on error (but does not leave unhandled rejections) (2/2)", async function() {
    const gen = asyncPool(
      2,
      [0, 1, 2],
      (i, a) => (i < a.length - 1 ? Promise.resolve(i) : Promise.reject(i))
    );
    expect((await gen.next()).value).to.equal(0);
    expect((await gen.next()).value).to.equal(1);
    await expect(gen.next()).to.be.rejected;
    // check console - no UnhandledPromiseRejectionWarning should appear
  });

  it("rejects as soon as first promise rejects", async function() {
    const startedTasks = [];
    const finishedTasks = [];
    const timeout = i => {
      startedTasks.push(i);
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (i === 30) {
            reject(new Error("Oops"));
          } else {
            finishedTasks.push(i);
            resolve();
          }
        }, i)
      );
    };

    const gen = asyncPool(2, [10, 50, 30, 20], timeout);
    const step1 = gen.next();
    const step2 = gen.next();
    const step3 = gen.next();
    await expect(step1).to.be.fulfilled;
    await expect(step2).to.be.rejected;
    expect(startedTasks).to.deep.equal([10, 50, 30]);
    expect(finishedTasks).to.deep.equal([10]);
    await expect(step3).to.be.fulfilled;

    // tasks started before the exception will continue, though - just wait a bit
    await new Promise(resolve => setTimeout(() => resolve(), 50));
    expect(startedTasks).to.deep.equal([10, 50, 30]);
    expect(finishedTasks).to.deep.equal([10, 50]);
  });
});
