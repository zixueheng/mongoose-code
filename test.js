const mongoose = require('mongoose');
const assert = require('assert');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// disabled _id，
// var childSchema = new mongoose.Schema({ name: String }, { _id: false }); //此选项只能用在子文档（子文档不需要_id）
// var parentSchema = new mongoose.Schema({ children: [childSchema] });

// var Model = mongoose.model('Model', parentSchema);

// Model.create({ children: [{ name: 'Luke' }, { name: 'Kitty'}] }, function(error, doc) {
//   // doc.children[0]._id will be undefined
// });


//toJSON 和toObject一样，但是只是在文档的toJSON调用的时候才起作用
// var schema = new Schema({ name: String });
// schema.path('name').get(function (v) { //设置name属性的 getter 方法
//   return v + ' is my name';
// });
// schema.virtual('anothername').get(function(){
//   return 'My another name is ' + this.name;
// });
// schema.set('toJSON', { getters: true, virtuals: true });
// var M = mongoose.model('Person', schema);
// var m = new M({ name: 'Max Headroom' });
// console.log(m.toObject()); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom' }
// console.log(m.toJSON()); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom is my name' }
// // since we know toJSON is called whenever a js object is stringified:
// console.log(JSON.stringify(m)); // { "_id": "504e0cd7dd992d9be2f20b6f", "name": "Max Headroom is my name" }


// var schema = new Schema({ name: String });
// schema.path('name').get(function (v) {
//   return v + ' is my name';
// });
// schema.set('toObject', { getters: true }); //To have all virtuals show up in your console.log output, set the toObject option to { getters: true }:
// var M = mongoose.model('Person', schema);
// var m = new M({ name: 'Max Headroom' });
// console.log(m); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom is my name' }


//validateBeforeSave Mongoose默认保存前验证数据，这是为了防止保存了非法数据；如果想手动验证，并且不管是否有错仍然保存数据，需将validateBeforeSave设置成false
// var schema = new Schema({name: String});
// schema.set('validateBeforeSave', false); //关闭验证
// schema.path('name').validate(function(v){ //定义非空验证
//   return v != null;
// });
// var M = mongoose.model('test', schema);
// var m = new M({name: null});
// m.validate(function(err) {
//   console.log(err); // Will tell you that null is not allowed.
// });
// m.save(); //尽管有错误 调用save 仍然会保证数据


//var thingSchema = new Schema({name: String}, { timestamps: true });
// var thingSchema = new Schema({name: String}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }); //这里自定这两个字段
// var Thing = mongoose.model('Thing', thingSchema);
// var thing = new Thing();
// thing.save(); // `created_at` & `updatedAt` will be included


// var userSchema = new Schema({
//     soicalMediaHandles: {
//         type: Map, //指定socialMeidaHandles类型是Map，
//         of: String //用 of 指定map的字段值是 String
//     }
// });
// var User = mongoose.model('User', userSchema);
// var user1 = new User({
//     soicalMediaHandles: {
//         github: 'vkarpov15',
//         twitter: '@code_barbarian',
//         num: 10
//     }
// });
// console.log(user1.soicalMediaHandles);

// var schema = new mongoose.Schema({ name: 'string', size: 'string' });
// var Tank = mongoose.model('Tank', schema);

// var small = new Tank({ size: 'small' }); //实例化一个文档
// small.save(function (err, samll) {  //然后保存它，回调函数可以处理错误或者进行保存成功后的操作
//   if (err) return handleError(err);
//   console.log(samll);
// });

// // 或者 调用model的 create 方法
// Tank.create({ size: 'big' }, function (err, big) {
//   if (err) return handleError(err);
//   console.log(big);
// });

// // 或者批量插入文档
// Tank.insertMany([{ size: 'large' }, { size: 'huge' }], function(err, data) {
//     console.log(data);
// });


// var toySchema = new Schema({
//   color: String,
//   name: String
// });
// var validator = function(value) {
//   return /red|white|gold/i.test(value);
// };
// toySchema.path('color').validate(validator, 'Color `{VALUE}` not valid', 'Invalid color');
// toySchema.path('name').validate(function(v) {
//   if (v !== 'Turbo Man') {
//       throw new Error('Need to get a Turbo Man for Christmas');
//   }
//   return true;
//   },
//   'Name `{VALUE}` is not valid'
// );
// var Toy = mongoose.model('Toy', toySchema);
// var toy = new Toy({ color: 'Green', name: 'Power Ranger' });
// toy.save(function (err) {
//   console.log(err);return;
//   // `err` is a ValidationError object
//   // `err.errors.color` is a ValidatorError object
//   assert.equal(err.errors.color.message, 'Color `Green` not valid');
//   assert.equal(err.errors.color.kind, 'Invalid color');
//   assert.equal(err.errors.color.path, 'color');
//   assert.equal(err.errors.color.value, 'Green');

//   // This is new in mongoose 5. If your validator throws an exception,
//   // mongoose will use that message. If your validator returns `false`,
//   // mongoose will use the 'Name `Power Ranger` is not valid' message.
//   assert.equal(err.errors.name.message, 'Need to get a Turbo Man for Christmas');
//   assert.equal(err.errors.name.value, 'Power Ranger');
//   // If your validator threw an error, the `reason` property will contain
//   // the original error thrown, including the original stack trace.
//   assert.equal(err.errors.name.reason.message, 'Need to get a Turbo Man for Christmas');

//   assert.equal(err.name, 'ValidationError');
// });


// var testSchema = new Schema({
//   number: { type: Number, max: 0 },
//   arr: [{ message: { type: String, maxlength: 10 } }]
// });
// // Update validators won't check this, so you can still `$push` 2 elements
// // onto the array, so long as they don't have a `message` that's too long.
// testSchema.path('arr').validate(function(v) {
//   return v.length < 2;
// });
// var Test = mongoose.model('Test', testSchema);
// Test.update({}, { $inc: { number: 1 } }, { runValidators: true }, function(error) { //这里的操作会成功，因为更新验证器会忽略 $inc 操作符
//   if(error) console.log(error);
//   // There will never be a validation error here
//   update = { $push: [{ message: 'hello' }, { message: 'world' }] };
//   Test.update({}, update, { runValidators: true }, function(error) {
//       if(error) console.log(error);
//       // This will never error either even though the array will have at
//       // least 2 elements.
//   });
// });


// var async = require('async');
// var util = require('util')
// //将一个Array中的元素，按照一定的规则转换，得到一个新的数组（元素个数不变)
// var Arr=[1,2,3,4,5];
// async.map(Arr, function(item,callback){
//       var _setValue = parseInt(item)+1;
//       callback(null,_setValue);
//   }, function(err,results){
//       console.log(results);
//   }
// );

// //和map一样，但是同步执行
// async.mapSeries(Arr, function(item,callback){
//     callback(null,parseInt(item)-1);
//   }, function(err,results){
//     console.log(results);
//   }
// );


// Discriminator 的字段是联合和上级 Schema的字段和 自己 schema的字段，并且 自己的schema字段优先，但是 默认的 _id 除外
// var options = {discriminatorKey: 'kind'};
// var eventSchema = new mongoose.Schema({_id: String, time: Date}, options); // Base schema has a String `_id` and a Date `time`...
// var Event = mongoose.model('BaseEvent', eventSchema);

// var clickedLinkSchema = new mongoose.Schema({url: String, time: String}, options);
// // But the discriminator schema has a String `time`, and an implicitly added ObjectId `_id`.
// assert.ok(clickedLinkSchema.path('_id'));
// assert.equal(clickedLinkSchema.path('_id').instance, 'ObjectID');
// var ClickedLinkEvent = Event.discriminator('ChildEventBad', clickedLinkSchema);

// var event1 = new ClickedLinkEvent({ _id: 'custom id', time: '4pm' });
// // Woops, clickedLinkSchema overwrites the `time` path, but **not** the `_id` path because that was implicitly added.
// assert.ok(typeof event1._id === 'string');
// assert.ok(typeof event1.time === 'string');


// 数组中内嵌的 discriminators
// 嵌入式的 Discriminator 有点不同，不同类型的discriminators是存在在一个document的同一个array 上的，换句话说 嵌入的discriminators可以让你一个数组上存储不同格式的子文档
var eventSchema = new Schema({ message: String }, { discriminatorKey: 'kind', _id: false });
var batchSchema = new Schema({ events: [eventSchema] });
var docArray = batchSchema.path('events'); // `batchSchema.path('events')` gets the mongoose `DocumentArray`

// The `events` array can contain 2 different types of events, a 'clicked' event that requires an element id that was clicked...
var clickedSchema = new Schema({
  element: {
    type: String,
    required: true
  }
}, { _id: false });
// Make sure to attach any hooks to `eventSchema` and `clickedSchema` **before** calling `discriminator()`.
var Clicked = docArray.discriminator('Clicked', clickedSchema);

// ... and a 'purchased' event that requires the product that was purchased.
var Purchased = docArray.discriminator('Purchased', new Schema({
  product: {
    type: String,
    required: true
  }
}, { _id: false }));

var Batch = mongoose.model('EventBatch', batchSchema);

// Create a new batch of events with different kinds
var batch = {
  events: [
    { kind: 'Clicked', element: '#hero', message: 'hello' },
    { kind: 'Purchased', product: 'action-figure-1', message: 'world' }
  ]
};

Batch.create(batch).
  then(function(doc) {
    assert.equal(doc.events.length, 2);

    assert.equal(doc.events[0].element, '#hero');
    assert.equal(doc.events[0].message, 'hello');
    assert.ok(doc.events[0] instanceof Clicked);

    assert.equal(doc.events[1].product, 'action-figure-1');
    assert.equal(doc.events[1].message, 'world');
    assert.ok(doc.events[1] instanceof Purchased);

    doc.events.push({ kind: 'Purchased', product: 'action-figure-2' });
    return doc.save();
  }).
  then(function(doc) {
    assert.equal(doc.events.length, 3);

    assert.equal(doc.events[2].product, 'action-figure-2');
    assert.ok(doc.events[2] instanceof Purchased);

    //done();
  }).
  catch();