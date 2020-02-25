const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// String
// Number
// Date
// Buffer
// Boolean
// Mixed
// ObjectId
// Array
// Decimal128
// Map

var schema = new Schema({
    name:    String,
    binary:  Buffer,
    living:  Boolean,
    updated: { type: Date, default: Date.now },
    age:     { type: Number, min: 18, max: 65 },
    mixed:   Schema.Types.Mixed,
    _someId: Schema.Types.ObjectId,
    decimal: Schema.Types.Decimal128,
    array: [],
    ofString: [String],
    ofNumber: [Number],
    ofDates: [Date],
    ofBuffer: [Buffer],
    ofBoolean: [Boolean],
    ofMixed: [Schema.Types.Mixed],
    ofObjectId: [Schema.Types.ObjectId],
    ofArrays: [[]],
    ofArrayOfNumbers: [[Number]],
    nested: {
        stuff: { type: String, lowercase: true, trim: true }
    },
    map: Map,
    mapOfString: {
        type: Map,
        of: String
    }
})

// example use
var Thing = mongoose.model('Thing', schema);

var m = new Thing;
m.name = 'Statue of Liberty';
m.age = 125;
m.updated = new Date;
m.binary = new Buffer(0);
m.living = false;
m.mixed = { any: { thing: 'i want' } };
m.markModified('mixed');
m._someId = new mongoose.Types.ObjectId;
m.array.push(1);
m.ofString.push("strings!");
m.ofNumber.unshift(1,2,3,4);
m.ofDates.addToSet(new Date);
m.ofBuffer.pop();
m.ofMixed = [1, [], 'three', { four: 5 }];
m.nested.stuff = 'good';
m.map = new Map([['key', 'value']]);
m.save(callback);


//schema 类型 选项
var schema1 = new Schema({
    test: String // 直接定义类型
});

var schema2 = new Schema({
    test: { type: String } // 放在选项里面用type指定类型，这样可以指定其他选项，如下
});

var schema2 = new Schema({
    test: {
        type: String,
        lowercase: true // `test` 总数转化为小写
    }
});

// 所有的 选项：
// required: boolean or function, if true adds a required validator for this property
// default: Any or function, sets a default value for the path. If the value is a function, the return value of the function is used as the default.
// select: boolean, specifies default projections for queries
// validate: function, adds a validator function for this property
// get: function, defines a custom getter for this property using Object.defineProperty().
// set: function, defines a custom setter for this property using Object.defineProperty().
// alias: string, mongoose >= 4.10.0 only. Defines a virtual with the given name that gets/sets this path.
var numberSchema = new Schema({
    integerOnly: {
        type: Number,
        get: v => Math.round(v),
        set: v => Math.round(v),
        alias: 'i'
    }
});
var Number = mongoose.model('Number', numberSchema);
var doc = new Number();
doc.integerOnly = 2.001;
doc.integerOnly; // 2
doc.i; // 2
doc.i = 3.001;
doc.integerOnly; // 3
doc.i; // 3


// 还可以用Schema选项定义 MongoDB的索引
// index: boolean, whether to define an index on this property.（普通索引）
// unique: boolean, whether to define a unique index on this property.（唯一索引）
// sparse: boolean, whether to define a sparse index on this property.（稀疏(间隙)索引）
var schema2 = new Schema({
    test: {
        type: String,
        index: true,
        unique: true // Unique index. If you specify `unique: true`
        // specifying `index: true` is optional if you do `unique: true`
    }
});

// String 类型的选项
//     lowercase: boolean, whether to always call .toLowerCase() on the value
//     uppercase: boolean, whether to always call .toUpperCase() on the value
//     trim: boolean, whether to always call .trim() on the value
//     match: RegExp, creates a validator that checks if the value matches the given regular expression
//     enum: Array, creates a validator that checks if the value is in the given array.
//     minlength: Number, creates a validator that checks if the value length is not less then the given number
//     maxlength: Number, creates a validator that checks if the value length is not greater then the given number

// Number 类型的选项
//     min: Number, creates a validator that checks if the value is greater than or equal to the given minimum.
//     max: Number, creates a validator that checks if the value is less than or equal to the given maximum.

// Date 类型的选项
//     min: Date
//     max: Date


// 使用注意：
// Dates，内置的Date函数未加入到Mongoose里面，这意味着你使用Date函数改变日期mongoose无法感知日期的变化
// 如果你使用内置的Date函数改变日期，在保存前需使用doc.markModified('pathToYourDate')告诉mongoose日期以发生改变
var Assignment = mongoose.model('Assignment', { dueDate: Date });
Assignment.findOne(function (err, doc) {
  doc.dueDate.setMonth(3); //改变日期
  doc.save(callback); // 这里不会保存

  doc.markModified('dueDate'); //这里告诉mongoose日期发送改变
  doc.save(callback); // 保存成功
});

//Mixed 混合类型或者叫任意类型，下面三种声明方式是等效的
var Any = new Schema({ any: {} });
var Any = new Schema({ any: Object });
var Any = new Schema({ any: Schema.Types.Mixed });
//Mongoose不能自动感应Mixed类型的数据改变，需要调用 .markModified(path)
// person.anything = { x: [3, 4, { y: "changed" }] };
// person.markModified('anything');
// person.save(); // anything will now get saved


// ObjectIds 
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Car = new Schema({ driver: ObjectId });
// or just Schema.ObjectId for backwards compatibility with v2


// Arrays 支持普通SchemaType类型和子文档类型数组
var ToySchema = new Schema({ name: String });
var ToyBox = new Schema({
  toys: [ToySchema], //子文档数组
  buffers: [Buffer], //Buffer数组
  string:  [String], //字符串数组
  numbers: [Number]  //数字数字
  // ... etc
});
// 数组是特别的，因为他隐含的有一个默认值 []（空数组）
var Toy = mongoose.model('Test', ToySchema);
console.log((new Toy()).toys); // []
var ToySchema = new Schema({
    toys: {
      type: [ToySchema],
      default: undefined //这里更改上面的默认值 [] 为 undefined
    }
  });
// 指定一个空数组 等同于 指定它是Mixed，下面创建的any字段都是 Mixed
var Empty1 = new Schema({ any: [] });
var Empty2 = new Schema({ any: Array });
var Empty3 = new Schema({ any: [Schema.Types.Mixed] });
var Empty4 = new Schema({ any: [{}] });


// Map
// MongooseMap是内置Map类的子类
var userSchema = new Schema({
    soicalMediaHandles: {
        type: Map, //指定socialMeidaHandles类型是Map，
        of: String //用 of 指定map的字段值是 String
    }
});
var User = new mongoose.model('User', userSchema);
var user1 = new User({
    soicalMediaHandles: {
        github: 'vkarpov15',
        twitter: '@code_barbarian',
        num: 10 //这里会将 10 转化成 '10'，因为上面声明了是String，如果字段值无法转化就会剔除（比如of: Number，github和twitter就会剔除）
    }
}); //这里的代码并没有在 Schema 里面申明 github、twitter两个字段，这是因为socialMediaHandles 是一个Map可以存储任意的键值对（key/value）
console.log(user1.soicalMediaHandles);
// Map {
//     'github' => 'vkarpov15',
//     'twitter' => '@code_barbarian',
//     'num' => '10' }
// 因为socialMediaHandles 是一个Map，你必须使用 .set()来设置一个属性的值 .get()来获取一个属性的值
const user = new User({
socialMediaHandles: {}
});

user.socialMediaHandles.set('github', 'vkarpov15'); // Good
user.set('socialMediaHandles.twitter', '@code_barbarian'); // Works too
user.socialMediaHandles.myspace = 'fail'; // Bad, the `myspace` property will **not** get saved

console.log(user.socialMediaHandles.get('github')); // 'vkarpov15'
console.log(user.get('socialMediaHandles.twitter')); // '@code_barbarian'
user.socialMediaHandles.github; // undefined
user.save(); // Will only save the 'github' and 'twitter' properties