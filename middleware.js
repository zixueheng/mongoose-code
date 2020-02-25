const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;


// 中间件（也被称作 pre 和 post hooks）是传入异步函数中用来控制执行流程的函数。中间件是应用在Schema上并很好写成插件。Mongoose有4中类型的中间件：
// 文档中间件（document middleware）、模型中间件（model middleware）、聚合中间件（aggregate middleware）、查询中间件（query middleware）.

// 文档中间件支持以下方法（文档中间件中的 this 指向 当前的 document）:
// init
// validate
// save
// remove

// 查询中间件支持以下 Model 和 Query 的函数（查询中间件中的 this 是当前的 查询对象 query）
// count
// find
// findOne
// findOneAndRemove
// findOneAndUpdate
// update


// 聚合中间件就是 MyModel.aggregate()，聚合中间件的执行是当你在一个 aggregate 对象上执行 exec() 函数时触发（聚合中间件的 this 指向当前 aggregate 对象）

// 模型中间件支持以下方法（在模型中间件中 this 指向当前 model 对象）
// insertMany



// Pre
// 有两种类型的 pre hooks，连续的（serial）和并行的（parallel）
// 连续的是一个接着一个执行，通过 next() 方法吊起 其他中间件
var schema = new Schema(/***/);
schema.pre('save', function(next) {
  // do stuff
  next();
});
// 在 Mongoose5.x ，除了手动的调用 next()，你还可以使用一个方法返回一个 promise，或者使用 async/await
schema.pre('save', function() {
    return doStuff(). //这里假设 doStuff() 返回一个promise
        then(() => doMoreStuff());
    }
);
// Or, in Node.js >= 7.6.0:
schema.pre('save', async function() {
    await doStuff();
    await doMoreStuff();
});
// 当你使用 next()，mongoose不会停止下面的中间件执行，除非你明确的使用 return 结束 下面的中间件的执行
var schema = new Schema(/***/);
schema.pre('save', function(next) {
  if (foo()) {
    console.log('calling next!');
    return next(); // `return next();` will make sure the rest of this function doesn't run
  }
  // Unless you comment out the `return` above, 'after next' will print
  console.log('after next');
});


// parallel
// 并行中间件提供更加颗粒化的流程控制
var schema = new Schema(/***/);
// `true` means this is a parallel middleware. You **must** specify `true`
// as the second parameter if you want to use parallel middleware.
schema.pre('save', true, function(next, done) { //设置第二个参数为 true 表示使用并行中间件
  // calling next kicks off the next middleware in parallel
  next(); //这里并行的调用其他中间件
  setTimeout(done, 100);
});


// 错误处理
// 如果有错误产生，mongoose不会继续执行后面的中间件或者挂载的钩子函数，而是传递一个错误给回调函数或者返回一个 rejected 的 promise
schema.pre('save', function(next) {
    const err = new Error('something went wrong');
    next(err); // If you call `next()` with an argument, that argument is assumed to be an error.
});
schema.pre('save', function() {
    return new Promise((resolve, reject) => { // You can also return a promise that rejects
        reject(new Error('something went wrong'));
    });
});
schema.pre('save', function() {
    throw new Error('something went wrong'); // You can also throw a synchronous error
});
schema.pre('save', async function() {
    await Promise.resolve();
    // You can also throw an error in an `async` function
    throw new Error('something went wrong');
});
// Changes will not be persisted to MongoDB because a pre hook errored out
myDoc.save(function(err) {
    console.log(err.message); // something went wrong
});


// Post 中间件
// Post 中间件是在挂载的函数和所有它的 pre 中间件执行完了 之后才执行
schema.post('init', function(doc) { //只针对 init() 中间件
    console.log('%s has been initialized from the db', doc._id);
});
schema.post('validate', function(doc) { //只针对 validate()
    console.log('%s has been validated (but not saved yet)', doc._id);
});
schema.post('save', function(doc) { //只针对 save()
    console.log('%s has been saved', doc._id);
});
schema.post('remove', function(doc) { //只针对 remove()
    console.log('%s has been removed', doc._id);
}); 

// 异步的 Post Hooks
// 如果你的 post hooks 的函数有至少两个参数，mongoose会假设第二个参数是 next()，这样你就可以顺序的调用下一个中间件
schema.post('save', function(doc, next) { // Takes 2 parameters: this is an asynchronous post hook
    setTimeout(function() {
        console.log('post1');
        next(); // Kick off the second post hook
    }, 10);
});
// Will not execute until the first middleware calls `next()`
schema.post('save', function(doc, next) { //不会执行直到第一个中间件调用 next()
    console.log('post2');
    next();
});


// Save/Validate Hooks
// save()方法会触发 validate() hooks，因为Mongoose内置了一个 pre('save') hook 调起 validate()，这意味着所有的pre('validate')和post('validate')是在pre('save') hooks之前执行
schema.pre('validate', function() {
    console.log('this gets printed first');
});
schema.post('validate', function() {
    console.log('this gets printed second');
});
schema.pre('save', function() {
    console.log('this gets printed third');
});
schema.post('save', function() {
    console.log('this gets printed fourth');
});