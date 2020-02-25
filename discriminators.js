const mongoose = require('mongoose');
const assert = require('assert');
const async = require('async');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// model.discriminator() 函数
// Discriminators 是 Schema 的一种继承机制，他可以让你获得基于同一个集合的多个重叠的 Models

var options = {discriminatorKey: 'kind'}; //这里指定的键值用来标识文档属于哪个 Discriminator，kind会保存到数据库中，值是discriminator()第一个参数指定的模型名称，如果不设置默认是 __t
var eventSchema = new mongoose.Schema({time: Date}, options);
var Event = mongoose.model('Event', eventSchema);
// ClickedLinkEvent is a special type of Event that has a URL.
var ClickedLinkEvent = Event.discriminator('ClickedLink', new mongoose.Schema({url: String}, options)); //第一个参数 model 名称，第二个参数 discriminator schema；实际上返回一个合并了Event的Schema和第二个参数指定的Schema的模型
// When you create a generic event, it can't have a URL field...
var genericEvent = new Event({time: Date.now(), url: 'google.com'}); //这里使用 Event 模型创建的 url 是无效的
// assert.ok(genericEvent.url); //抛出异常 genericEvent.url未定义
// But a ClickedLinkEvent can
var clickedEvent = new ClickedLinkEvent({time: Date.now(), url: 'google.com'}); // ClickedLinkEvent 则可以 有 url
assert.ok(clickedEvent.url);

// 保存数据
// var event1 = new Event({time: Date.now()});
// var event2 = new ClickedLinkEvent({time: Date.now(), url: 'google.com'});
// var SignedUpEvent = Event.discriminator('SignedUp', new Schema({user: String}, options)); //再定义一个Event 的 Discrimiator
// var event3 = new SignedUpEvent({time: Date.now(), user: 'testuser'});
// var save = function (doc, callback) {
//   doc.save(function (error, doc) {
//     callback(error, doc);
//   });
// };
// async.map([event1, event2, event3], save, function (error) { //异步保存数据，三条数据都会保存到Events集合中，kind字段会标识文档是哪个Discriminator
//   Event.count({}, function (error, count) {
//     assert.equal(count, 3);
//   });
// });
Event.find({}).exec(function(err, data){ //这里会查找所有的文档
    console.log(data);
});
// [ { _id: 5b349272907829360c435224,
//     time: 2018-06-28T07:46:58.516Z,
//     __v: 0 },
//   { kind: 'ClickedLink',
//     _id: 5b349272907829360c435225,
//     time: 2018-06-28T07:46:58.516Z,
//     url: 'google.com',
//     __v: 0 },
//   { _id: 5b349272907829360c435226,
//     kind: 'SignedUp',
//     time: 2018-06-28T07:46:58.517Z,
//     user: 'testuser',
//     __v: 0 } ]
ClickedLinkEvent.find({}, function (error, docs) { //这里只会查找 kind:ClickedLink 的文档，Discriminator 的模型会自动把discriminatorKey 加入到 Query 条件当中
    console.log(docs);
});
// [ { kind: 'ClickedLink',
//     _id: 5b349272907829360c435225,
//     time: 2018-06-28T07:46:58.516Z,
//     url: 'google.com',
//     __v: 0 } ]


// Discriminators 会集成上级model的 pre 和 post hooks，你也可以在 discriminator 上定义 pre 和 post hooks 而不影响上层 model


// Discriminator 的字段是联合和上级 Schema的字段和 自己 schema的字段，并且 自己的schema字段优先，但是 默认的 _id 除外
var options = {discriminatorKey: 'kind'};
var eventSchema = new mongoose.Schema({_id: String, time: Date}, options); // Base schema has a String `_id` and a Date `time`...
var Event = mongoose.model('BaseEvent', eventSchema);

var clickedLinkSchema = new mongoose.Schema({url: String, time: String}, options);
// But the discriminator schema has a String `time`, and an implicitly added ObjectId `_id`.
assert.ok(clickedLinkSchema.path('_id'));
assert.equal(clickedLinkSchema.path('_id').instance, 'ObjectID');
var ClickedLinkEvent = Event.discriminator('ChildEventBad', clickedLinkSchema);

var event1 = new ClickedLinkEvent({ _id: 'custom id', time: '4pm' });
// Woops, clickedLinkSchema overwrites the `time` path, but **not** the `_id` path because that was implicitly added.
assert.ok(typeof event1._id === 'string');
assert.ok(typeof event1.time === 'string');


// 当使用 Model.create()，mongoose会自动使用正确的 discriminator key
var Shape = mongoose.model('Shape', new Schema({name: String}, { discriminatorKey: 'kind' }));
var Circle = Shape.discriminator('Circle', new Schema({ radius: Number }));
var Square = Shape.discriminator('Square', new Schema({ side: Number }));
var shapes = [
  { name: 'Test' },
  { kind: 'Circle', radius: 5 },
  { kind: 'Square', side: 10 }
];
Shape.create(shapes, function(error, shapes) {
  assert.ifError(error);
  assert.ok(shapes[0] instanceof Shape);
  assert.ok(shapes[1] instanceof Circle);
  assert.equal(shapes[1].radius, 5);
  assert.ok(shapes[2] instanceof Square);
  assert.equal(shapes[2].side, 10);
});


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

    done();
  }).
  catch(done);