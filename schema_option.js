const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// 给模式添加选项
// new Schema({/***/}, options); // or
// var schema = new Schema({/***/});
// schema.set(option, value);


//自动索引 autoIndex，Mongoose 默认自动创建索引
var schema = new Schema({/***/}, { autoIndex: false }); //禁止自动创建索引
var Clock = mongoose.model('Clock', schema);
Clock.ensureIndexes(function (err) { //发送创建索引的命令给MongoDB，程序会按 Schema 声明的索引进行创建
    if (err) return handleError(err);
}); 


//缓存命令 bufferCommands，Mongoose默认在连接失效后缓存所有命令直到连接重新成功
var schema = new Schema({/***/}, { bufferCommands: false }); //禁用缓存命令，好像没什么用


//封顶的collection：capped
new Schema({/***/}, { capped: 1024 }); //这里指定collection最大1M
new Schema({/***/}, { capped: { size: 1024, max: 1000, autoIndexId: true } }); //如果要和其他option一起用 要指定size


//虚拟属性 id，其实就是 getter MongoDB的 _id 的值（这是Mongoose 自动分配的）
var schema = new Schema({ name: String }); // default behavior
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p.id); // '50341373e894ad16347efe01'

var schema = new Schema({ name: String }, { id: false }); // disabled id
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p.id); // undefined


//_id，Mongoose会分配给每个Schema一个 _id，也就是数据库中的ObjectId，不建议禁用_id，保存的时候会报错，没有_id Mongoose无法保存文档
// default behavior
var schema = new Schema({ name: String });
var Page = mongoose.model('Page', schema);
var p = new Page({ name: 'mongodb.org' });
console.log(p); // { _id: '50341373e894ad16347efe01', name: 'mongodb.org' }

// disabled _id，
var childSchema = new Schema({ name: String }, { _id: false }); //此选项只能用在子文档（子文档不需要_id）
var parentSchema = new Schema({ children: [childSchema] });
var Model = mongoose.model('Model', parentSchema);
Model.create({ children: [{ name: 'Luke' }] }, function(error, doc) {
  // doc.children[0]._id will be undefined
});


//minimize 最小化存储，用来移除空数组和空对象
var schema = new Schema({ name: String, inventory: {} });
var Character = mongoose.model('Character', schema);
var frodo = new Character({ name: 'Frodo', inventory: { ringOfPower: 1 }}); // will store `inventory` field if it is not empty
Character.findOne({ name: 'Frodo' }, function(err, character) {
  console.log(character); // { name: 'Frodo', inventory: { ringOfPower: 1 }}
});
var sam = new Character({ name: 'Sam', inventory: {}}); // will not store `inventory` field if it is empty
Character.findOne({ name: 'Sam' }, function(err, character) {
  console.log(character); // { name: 'Sam' }
});

var schema = new Schema({ name: String, inventory: {} }, { minimize: false }); //minimize 设置成false 不会移除空的文档
var Character = mongoose.model('Character', schema);
var sam = new Character({ name: 'Sam', inventory: {}}); // will store `inventory` if empty
Character.findOne({ name: 'Sam' }, function(err, character) {
  console.log(character); // { name: 'Sam', inventory: {}}
});


//strict 严格模式，默认开启，可以保证未在Schema定义的字段不会保存到数据库中
var thingSchema = new Schema({/***/})
var Thing = mongoose.model('Thing', thingSchema);
var thing = new Thing({ iAmNotInTheSchema: true }); //iAmNotInTheSchema 是在Schema中未定义的字段
thing.save(); // iAmNotInTheSchema不会保存到数据库

var thingSchema = new Schema({/***/}, { strict: false }); // set to false..
var thing = new Thing({ iAmNotInTheSchema: true });
thing.save(); // iAmNotInTheSchema 会保存到数据库


//strictQuery 严格查询（这里还不理解）
//strict选项不会应用到查询过滤参数中，这是为了后续的兼容性
const mySchema = new Schema({ field: Number }, { strict: true });
const MyModel = mongoose.model('Test', mySchema);
// Mongoose will **not** filter out `notInSchema: 1`, despite `strict: true`
MyModel.find({ notInSchema: 1 });
//Mongoose有单独的strictQuery选项来为查询过滤开启严格模式 Mongoose has a separate strictQuery option to toggle strict mode for the filter parameter to queries.
const mySchema = new Schema({ field: Number }, {
  strict: true,
  strictQuery: true // Turn on strict mode for query filters
});
const MyModel = mongoose.model('Test', mySchema);
// Mongoose will strip out `notInSchema: 1` because `strictQuery` is `true`
MyModel.find({ notInSchema: 1 });


//toJSON 和toObject一样，但是只是在文档的toJSON调用的时候才起作用
var schema = new Schema({ name: String });
schema.path('name').get(function (v) { //设置name属性的 getter 方法
  return v + ' is my name';
});
schema.virtual('anothername').get(function(){
  return 'My another name is ' + this.name;
});
schema.set('toJSON', { getters: true, virtuals: false }); //toJSON()和stringify 会输出上面设置的getter，如果将virtuals:true 会展示another、id这两个虚拟属性
var M = mongoose.model('Person', schema);
var m = new M({ name: 'Max Headroom' });
console.log(m.toObject()); //原始数据输出 { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom' }
console.log(m.toJSON()); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom is my name' }
// since we know toJSON is called whenever a js object is stringified:
console.log(JSON.stringify(m)); // { "_id": "504e0cd7dd992d9be2f20b6f", "name": "Max Headroom is my name" }


//toObject document有一个toObject方法将mongoose文档转化为纯JS对象
var schema = new Schema({ name: String });
schema.path('name').get(function (v) {
  return v + ' is my name';
});
schema.set('toObject', { getters: true }); //To have all virtuals show up in your console.log output, set the toObject option to { getters: true }:
var M = mongoose.model('Person', schema);
var m = new M({ name: 'Max Headroom' });
console.log(m); // { _id: 504e0cd7dd992d9be2f20b6f, name: 'Max Headroom is my name' }


//typeKey Mongoose理解 type 字段是 类型声明，要使用 type字段 需声明typeKey选项
var schema = new Schema({ loc: { type: String, coordinates: [Number] } }); // Mongoose interprets this as 'loc is a String'
var schema = new Schema(
  {
    loc: { type: String, coordinates: [Number] }, // Mongoose interpets this as 'loc is an object with 2 keys, type and coordinates'
    name: { $type: String } // Mongoose interprets this as 'name is a String'
  },
  { typeKey: '$type' } //这里指定 使用了 $type 的是类型声明，而type则变成字段名 // A '$type' key means this object is a type declaration
); 


//validateBeforeSave Mongoose默认保存前验证数据，这是为了防止保存了非法数据；如果想手动验证，并且不管是否有错仍然保存数据，需将validateBeforeSave设置成false
var schema = new Schema({name: String});
schema.set('validateBeforeSave', false); //关闭验证，这里不建议关闭
schema.path('name').validate(function(v){ //定义非空验证
  return v != null;
});
var M = mongoose.model('test', schema);
var m = new M({name: null});
m.save(); //有错，但是还是会保存成功


//versionKey 版本键，Mongoose第一次创建文档时会分配一个versionKey，默认是 _v
var schema = new Schema({ name: 'string' });
var Thing = mongoose.model('Thing', schema);
var thing = new Thing({ name: 'mongoose v3' });
thing.save(); // { __v: 0, name: 'mongoose v3' }
// customized versionKey
new Schema({/***/}, { versionKey: '_somethingElse' })
var Thing = mongoose.model('Thing', schema);
var thing = new Thing({ name: 'mongoose v3' });
thing.save(); // { _somethingElse: 0, name: 'mongoose v3' }
new Schema({/***/}, { versionKey: false }); //你可以禁用这个字段，但是不建议这么做


//collation 校勘
var schema = new Schema({
  name: String
}, { collation: { locale: 'en_US', strength: 1 } });
var MyModel = db.model('MyModel', schema);
MyModel.create([{ name: 'val' }, { name: 'Val' }]).
then(function() {
  return MyModel.find({ name: 'val' });
}).
then(function(docs) {
  // `docs` will contain both docs, because `strength: 1` means
  // MongoDB will ignore case when matching.
});


//timestamps 如果设置时间戳 Mongoose会在你的Schema增加createAt UpdateAt两个字段来表示创建更新时间
var thingSchema = new Schema({/***/}, { timestamps: true });
//var thingSchema = new Schema({/***/}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }); //这里自定这两个字段
var Thing = mongoose.model('Thing', thingSchema);
var thing = new Thing();
thing.save(); // `created_at` & `updatedAt` will be included
