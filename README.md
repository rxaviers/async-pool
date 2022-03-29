# asyncPool

## Why?

The goal of this library is to use native async iterator (ES9), native async functions and native Promise to implement the concurrency behavior (look our source code).

If you need ES6 as baseline, please use our version [1.x](https://github.com/rxaviers/async-pool/tree/1.x).

## What?

`asyncPool` runs multiple promise-returning & async functions in a limited concurrency pool. It rejects immediately as soon as one of the promises rejects. It calls the iterator function as soon as possible (under concurrency limit). It returns an async iterator that yields as soon as a promise completes (under concurrency limit). For example:

```js
const timeout = ms => new Promise(resolve => setTimeout(() => resolve(ms), ms));

for await (const ms of asyncPool(2, [1000, 5000, 3000, 2000], timeout)) {
  console.log(ms);
}
// Call iterator timeout(1000)
// Call iterator timeout(5000)
// Concurrency limit of 2 reached, wait for the quicker one to complete...
// 1000 finishes
// for await...of outputs "1000"
// Call iterator timeout(3000)
// Concurrency limit of 2 reached, wait for the quicker one to complete...
// 3000 finishes
// for await...of outputs "3000"
// Call iterator timeout(2000)
// Itaration is complete, wait until running ones complete...
// 5000 finishes
// for await...of outputs "5000"
// 2000 finishes
// for await...of outputs "2000"
```

## Usage

```
$ npm install tiny-async-pool
```

```js
import asyncPool from "tiny-async-pool";
```

### ES9 for await...of

```js
for await (const value of asyncPool(concurrency, iterable, iteratorFn)) {
  ...
}
```

## Migrating from 1.x

The main difference: [1.x API](https://github.com/rxaviers/async-pool/tree/1.x) waits until all of the promises completes, then all results are returned (example below). The new API (thanks to [async iteration](https://github.com/tc39/proposal-async-iteration)) let each result be returned as soon as it completes (example above).

You may prefer to keep the 1.x style syntax, instead of the `for await` iteration method in 2.x. Define a function like below to wrap `asyncPool`, and this function will allow you to upgrade to 2.x without having to heavily modify your existing code.

```js
async function asyncPoolAll(...args) {
  const results = [];
  for await (const result of asyncPool(...args)) {
    results.push(result);
  }
  return results;
}

// ES7 API style available on our previous 1.x version
const results = await asyncPoolAll(concurrency, iterable, iteratorFn);

// ES6 API style available on our previous 1.x version
return asyncPoolAll(2, [1000, 5000, 3000, 2000], timeout).then(results => {...});
```

## API

### `asyncPool(concurrency, iterable, iteratorFn)`

Runs multiple promise-returning & async functions in a limited concurrency pool. It rejects immediately as soon as one of the promises rejects. It calls the iterator function as soon as possible (under concurrency limit). It returns an async iterator that yields as soon as a promise completes (under concurrency limit).

#### concurrency

The concurrency limit number (>= 1).

#### iterable

An input [iterable object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol), such as [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), and [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

#### iteratorFn

Iterator function that takes two arguments: the value of each iteration and the iterable object itself. The iterator function should either return a promise or be an async function.

## License

MIT © [Rafael Xavier de Souza](http://rafael.xavier.blog.br)
