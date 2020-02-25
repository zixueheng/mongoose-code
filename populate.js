const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// MongoDB 有 $lookup 操作符来执行类似 join 的操作，Mongoose有更加有效的替代函数 populate()，可以让你在其他集合中引用文档
// Population 是一种可以让你在文档中用其他集合里面的文档自动替换指定 paths 的方法，你可以填充单文档、多文档、纯对象、多纯对象、或者其他所有从一个Query中返回的对象
var personSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    age: Number,
    stories: [{type: Schema.Types.ObjectId, ref: 'Story'}] //这里是 ObjectId数组，并且 ref 选项表明 _id 指向 Story 模型（填充的时候使用这个模型）
});
var storySchema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: 'Person'}, //这里是 ObjectId对象，并且 ref 选项表明 _id 指向 Person 模型（填充的时候使用这个模型）
    title: String,
    fans: [{type: Schema.Types.ObjectId, ref: 'Person'}] //这里是 ObjectId数组，并且 ref 选项表明 _id 指向 Person 模型（填充的时候使用这个模型）
});
// 注意 rel 可以使用 ObjectId, Number, String, 和 Buffer 这四种类型，通常建议使用 ObjectId
var Story = mongoose.model('Story', storySchema); //对应数据库中的 stories 集合
var Person = mongoose.model('Person', personSchema); //对应数据库中的 people 集合
// 下面保存一条数据：
// var person1 = new Person({
//     _id: new mongoose.Types.ObjectId(),
//     name: 'Jack Jones',
//     age: 20
// });
// person1.save(function(error){
//     if(error) throw new Error(error);
//     var story1 = new Story({
//         author: person1._id,
//         title: 'My first blog'
//     });
//     story1.save(function(error){
//         if(error) throw new Error(error);
//         console.log('Saved!');
//     });
// });
// 下面使用查询构造函数来填充story的 author
Story.findOne({title:'My first blog'}).populate('author').exec(function(error, story){
    if(error) throw new Error(error);
    console.log(story); //story的author字段被替换成对应_id 的person 对象
});


// 字段选择（Field Selection）
// 可以在populate() 指定 第二个参数 field name syntax（http://mongoosejs.com/docs/api.html#query_Query-select）来包含或排除某些字段
Story.findOne({title:'My first blog'}).populate('author', 'name').exec(function(error, story){ //只包含 name 字段，隐含的包含了 _id
    if(error) throw new Error(error);
    //console.log(story);
    console.log('The author is %s', story.author.name); // The author is Jack Jones
    console.log('The authors age is %s', story.author.age); // The authors age is undefined
});


// 填充多个 paths
Story.
  find(/***/).
  populate('fans').
  populate('author').
  exec();
// 如果填充多个一样的 path，只有最后一个有效：
// Story. // The 2nd `populate()` call below overwrites the first because they both populate 'fans'.
//   find().
//   populate({ path: 'fans', select: 'name' }).
//   populate({ path: 'fans', select: 'email' }); //这里会覆盖上面一个，因为他们都填充同一个字段 fans
// 和下面的等效：
// Story.find().populate({ path: 'fans', select: 'email' });


// 查询条件和选项
Story.
  find(/***/).
  populate({
    path: 'fans', //填充fans 字段
    match: { age: { $gte: 21 }}, //满足 age>=21
    select: 'name -_id', //只包含 name 字段（排除 _id）
    options: { limit: 5 } //最多5个
  }).
  exec();


// 填充已存在的文档
// 如果你已经有一个Mongoose文档并且想填充其中的某些paths，可以使用 document 的 populate()
doc
.populate('company')
.populate({
  path: 'notes',
  match: /airline/,
  select: 'text',
  model: 'modelName',
  options: {}
}, function (err, user) { //填充不会执行，除非你传入一个回调函数
  assert(doc._id === user._id) // the document itself is passed
})
// 总结
doc.populate(path)                   // 不会执行
doc.populate(options);               // 不会执行
doc.populate(path, callback)         // 执行
doc.populate(options, callback);     // 执行
doc.populate(callback);              // 执行
doc.populate(options).execPopulate() // 执行, 返回 promise

// var promise = doc.
//   populate('company').
//   populate({
//     path: 'notes',
//     match: /airline/,
//     select: 'text',
//     model: 'modelName',
//     options: {}
//   }).
//   execPopulate(); //这里返回 promise
// // 总结
// doc.execPopulate().then(resolve, reject);


// 多层填充
var userSchema = new Schema({
    name: String,
    friends: [{type:Schema.Types.ObjectId, ref: 'User'}]
});
var User = mongoose.model('User', userSchema);
User.findOne({'name': 'Jack Jones'}).populate({path: 'friends', populate: {path: 'friends'}}).exec(function(err, user){ //这里获取朋友的朋友
    //
});


// 跨数据库填充
var eventSchema = new Schema({
    name: String,
    // The id of the corresponding conversation
    // Notice there's no ref here!
    conversation: ObjectId //这里没有指定 ref参数，因为跨库操作不需要
});
var conversationSchema = new Schema({
    numMessages: Number
});
// 这里  events and conversations 分别存储在不同的数据库中：
var db1 = mongoose.createConnection('localhost:27000/db1');
var db2 = mongoose.createConnection('localhost:27001/db2');
var Event = db1.model('Event', eventSchema);
var Conversation = db2.model('Conversation', conversationSchema);
Event.
  find().
  populate({ path: 'conversation', model: Conversation }). //这里要指定 model 参数，不指定的话在db1中找不到 conversation 的
  exec(function(error, docs) { /* ... */ });


// 动态引用
// Mongoose可以同时从多个集合中填充文档
// 假设一个人有一个 connections 数组，可以是另外一个人或者一个组织
var userSchema = new Schema({
    name: String,
    connections: [{
        kind: String, //根据下面的设定，这里的值决定着填充要用哪个model
        item: { type: ObjectId, refPath: 'connections.kind' } // refPath属性意味着 Mongoose将依据 connections.kind 来决定用哪个model来填充
    }]
});
var organizationSchema = new Schema({ name: String, kind: String });
var User = mongoose.model('User', userSchema);
var Organization = mongoose.model('Organization', organizationSchema);
// 假设我们有一个组织:
// `{ _id: ObjectId('000000000000000000000001'), name: "Guns N' Roses", kind: 'Band' }`
// 和两个用户:
// {
//   _id: ObjectId('000000000000000000000002')
//   name: 'Axl Rose',
//   connections: [
//     { kind: 'User', item: ObjectId('000000000000000000000003') },
//     { kind: 'Organization', item: ObjectId('000000000000000000000001') }
//   ]
// },
// {
//   _id: ObjectId('000000000000000000000003')
//   name: 'Slash',
//   connections: []
// }
User.
  findOne({ name: 'Axl Rose' }).
  populate('connections.item').
  exec(function(error, doc) {
    // doc.connections[0].item is a User doc 因为这里的 connections.kind 是User，所以使用 User 模型
    // doc.connections[1].item is an Organization doc 因为这里的 connections.kind 是Organization，所以使用 Organization 模型
  });


// 填充虚拟属性（Populate Virtuals）
var PersonSchema = new Schema({
    name: String,
    band: String
});
var BandSchema = new Schema({
    name: String
});
BandSchema.virtual('members', { //这里的判断条件是 Band.name(localField指定) == Person.band(foreignField指定)
    ref: 'Person', // The model to use
    localField: 'name', // Find people where `localField`
    foreignField: 'band', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to an array. `justOne` is false by default.
    justOne: false
});

var Person = mongoose.model('Person', PersonSchema);
var Band = mongoose.model('Band', BandSchema);
/**
 * Suppose you have 2 bands: "Guns N' Roses" and "Motley Crue"
 * And 4 people: "Axl Rose" and "Slash" with "Guns N' Roses", and
 * "Vince Neil" and "Nikki Sixx" with "Motley Crue"
 */
Band.find({}).populate('members').exec(function(error, bands) {
    /* `bands.members` is now an array of instances of `Person` */
});

// 请注意：虚拟属性不会包含在 toJSON() 函数的输出当中，如果你希望填充的虚拟属性被显示出来特别是基于 JSON.stringify()函数像 Express的 res.json() ，需在你的Schema上 toJSON 选项上设置 virtual:true
var BandSchema = new Schema({
    name: String
  }, { toJSON: { virtuals: true }  // Set `virtuals: true` so `res.json()` works
});
// 如果要填充指定字段，要保证 foreignField 指定的字段包含在 projections 当中
Band.
  find({}).
  populate({ path: 'members', select: 'name' }).
  exec(function(error, bands) {
    // Won't work, foreign field `band` is not selected in the projection
  });
Band.
  find({}).
  populate({ path: 'members', select: 'name band' }).
  exec(function(error, bands) {
    // Works, foreign field `band` is selected
  });


// 中间件中的填充（Populate in Middleware）
// 你可以在 pre 或者 post hooks 中定义填充，下面的操作是为了省去每次具体操作时的填充
// Always attach `populate()` to `find()` calls
MySchema.pre('find', function() { // 在调用 find() 时追加 populate()
    this.populate('user');
});
// Always `populate()` after `find()` calls. Useful if you want to selectively populate based on the docs found.
MySchema.post('find', async function(docs) { //在 find() 之后执行 populate()
    for (let doc of docs) {
        if (doc.isPublic) {
            await doc.populate('user').execPopulate();
        }
    }
});
// `populate()` after saving. Useful for sending populated data back to the client in an update API endpoint
MySchema.post('save', function(doc, next) {
    doc.populate('user').execPopulate(function() {
        next();
    });
});
  