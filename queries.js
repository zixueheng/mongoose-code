const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// Mongoose 的模型（Models）提供了一些静态方法来执行 CRUD 操作，每一个方法返回一个 Mongoose Query 对象

// Model.deleteMany()
// Model.deleteOne()
// Model.find()
// Model.findById()
// Model.findByIdAndDelete()
// Model.findByIdAndRemove()
// Model.findByIdAndUpdate()
// Model.findOne()
// Model.findOneAndDelete()
// Model.findOneAndRemove()
// Model.findOneAndUpdate()
// Model.replaceOne()
// Model.updateMany()
// Model.updateOne()

// Mongoose的query有两种执行方式：1、在操作方法中传入回调函数，Query操作会立即执行，并且可以在回调函数传入返回结果；2、也可以像使用Promise对象那样 调用 .then()方法
var personSchema = new Schema({
    name: {
        first: String,
        last: String
    },
    occupation: String
});
var Person = mongoose.model('person', personSchema);
Person.findOne({'name.last': 'Ghost'}, 'name occupation', function(err, person){ //查找 name.last 是Ghost的人的 name 和occupation 两个字段
    if(err) throw new Error('Find Error!');
    console.log('%s %s is a %s.', person.name.first, person.name.last, person.occupation);
});
// 以这种方式执行的 CRUD 会立即执行，回调函数使用这种形式：callback(error, result)，发送错误error包含错误的文档result是null，没有错误 error是null result是执行结果
// result结果类型要根据到底执行了什么操作：例如 findOne()返回单个文档，find()返回文档列表，count()返回文档数量，update()返回受影响的文档条数，等等

// 拆解上面的查询如下：
var query = Person.findOne({ 'name.last': 'Ghost' }); // find each person with a last name matching 'Ghost'
query.select('name occupation'); // selecting the `name` and `occupation` fields
query.exec(function (err, person) { // execute the query at a later time
  if (err) return handleError(err);
  // Prints "Space Ghost is a talk show host."
  console.log('%s %s is a %s.', person.name.first, person.name.last, person.occupation);
});
// 上面的query是Mongoose的Query对象，它可以让你执行链式操作，而不是指定JSON对象参数

Person. // With a JSON doc（JSON语法等同于 MongoDB Shell语法）
  find({
    occupation: /host/,
    'name.last': 'Ghost',
    age: { $gt: 17, $lt: 66 },
    likes: { $in: ['vaporizing', 'talking'] }
  }).
  limit(10).
  sort({ occupation: -1 }).
  select({ name: 1, occupation: 1 }).
  exec(callback);
// 等同于以下方式：
Person. // Using query builder（查询构造器）
  find({ occupation: /host/ }).
  where('name.last').equals('Ghost').
  where('age').gt(17).lt(66).
  where('likes').in(['vaporizing', 'talking']).
  limit(10).
  sort('-occupation').
  select('name occupation').
  exec(callback);


// Query不是Promise，它只是有个 .then() 方法，可以像co(https://www.npmjs.com/package/co) and async/await(http://thecodebarbarian.com/common-async-await-design-patterns-in-node.js.html) 函数那样方便而已。
// 所以不同于Promise，它可以执行多次
const q = MyModel.updateMany({}, { isDeleted: true }, function() { //使用回调函数执行更新
    console.log('Update 1');
});
q.then(() => console.log('Update 2')); //使用 then 执行更新
q.then(() => console.log('Update 3')); //再次使用 then 执行更新
// 尽量不要混合使用回调函数和 then()，那样你的代码会很混乱


// 引用其他文档
// MongoDB 没有类似 关系数据库 的 join 操作，但是我们还是希望在文档中引用其他集合的文档，所有要使用 population（参看 populate.js） 


// 流（Stream）
// 你可以用流的方式执行查询（参看https://nodejs.org/api/stream.html），调用 Query对象的 cursor() 方法 返回一个 QueryCursor 对象
var cursor = Person.find({ occupation: /host/ }).cursor();
cursor.on('data', function(doc) {
  // Called once for every document
});
cursor.on('close', function() {
  // Called when done
});
// 参看 http://mongoosejs.com/docs/api.html#query_Query-cursor