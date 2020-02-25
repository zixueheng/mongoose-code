const mongoose = require('mongoose');
const assert = require('assert');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// Mongoose几个规则：
// 1、验证器是定义在 SchemaType 上的；
// 2、验证器是中间件，Mongoose 默认是将验证器注册在每个 Schema 的 pre('save') 的钩子上的；
// 3、验证器可以通过调用 doc.validate(callback) 或者 doc.validateSync() 来手动执行；
// 4、验证器不能在 undefined 值上运行，除了required 验证器；
// 5、验证器是异步递归的，当你调用 Model 的 save() 方法，子文档的验证器也会执行。当有错误产生，Model 的 save() 方法的回调函数会收到它；
// 6、验证器是可自定义的。
var schema = new Schema({
    name: {
        type: String,
        required: true //定义在 SchemaType 上的 required 验证器
    }
});
var Cat = mongoose.model('Cat', schema);
var cat = new Cat(); // This cat has no name :(
cat.save(function(error) { //保存的时候触发 required 验证器
    assert.equal(error.errors['name'].message, 'Path `name` is required.');

    error = cat.validateSync(); //手动验证
    assert.equal(error.errors['name'].message, 'Path `name` is required.');
});


// Mongoose的几个内置验证器
// 1、所有的 SchemaTypes 拥有内置的 required 验证器，它使用 SchemaType 的 checkRequired() 方法判断值是否满足要求；
// 2、Number 有 min 和 max 验证器；
// 3、String 有 enum、match、maxlength 和 minlength 几个验证器。
var breakfastSchema = new Schema({
    eggs: {
        type: Number,
        min: [6, 'Too few eggs'], //自定义错误信息
        max: 12
    },
    bacon: {
        type: Number,
        required: [true, 'Why no bacon?'] //自定义错误信息
    },
    drink: {
        type: String,
        enum: ['Coffee', 'Tea'],
        required: function() {
            return this.bacon > 3;
        }
    }
});
var Breakfast = mongoose.model('Breakfast', breakfastSchema);
var badBreakfast = new Breakfast({
    eggs: 2,
    bacon: 0,
    drink: 'Milk'
});
var error = badBreakfast.validateSync();
assert.equal(error.errors['eggs'].message, 'Too few eggs');
assert.ok(!error.errors['bacon']);
assert.equal(error.errors['drink'].message, '`Milk` is not a valid enum value for path `drink`.');

badBreakfast.bacon = 5;
badBreakfast.drink = null;
error = badBreakfast.validateSync();
assert.equal(error.errors['drink'].message, 'Path `drink` is required.');

badBreakfast.bacon = null;
error = badBreakfast.validateSync();
assert.equal(error.errors['bacon'].message, 'Why no bacon?');


// unique 选项不是验证器，它只是指定 Mongoose 创建 unique 索引
var uniqueUsernameSchema = new Schema({
    username: {
        type: String,
        unique: true //唯一索引
    }
});
var U1 = mongoose.model('U1', uniqueUsernameSchema);
var U2 = mongoose.model('U2', uniqueUsernameSchema);
var dup = [{ username: 'Val' }, { username: 'Val' }]; //两个一样的username
U1.create(dup, function(error) { //这里可能出错，如果MongoDB在写入这两条文档后才创建索引，这两条重复的数据就会保存成功
});
// Need to wait for the index to finish building before saving,
// otherwise unique constraints may be violated.
U2.once('index', function(error) { //所以这里需要先创建索引成功后再执行其他操作
    assert.ifError(error);
    U2.create(dup, function(error) { // 保存错误，但是不是验证器错误，而是 duplicate key 错误
        assert.ok(error);
        assert.ok(!error.errors);
        assert.ok(error.message.indexOf('duplicate key error') !== -1);
    });
});
// There's also a promise-based equivalent to the event emitter API.
// The `init()` function is idempotent and returns a promise that
// will resolve once indexes are done building;
U2.init().then(function() { //也可以使用Promise，等同于上面的 事件触发（event emitter） 形式
    //当 init() 返回的 promise 一旦 resolve ，索引也就创建成功了，接着就可以进行其他保存操作了
    U2.create(dup, function(error) { // 保存错误，但是不是验证器错误，而是 duplicate key 错误
        assert.ok(error);
        assert.ok(!error.errors);
        assert.ok(error.message.indexOf('duplicate key error') !== -1);
    });
});


// 自定义验证器，如：
var userSchema = new Schema({
    phone: {
        type: String,
        validate: { //自定义验证器 手机号码（`DDD-DDD-DDDD`）验证
            validator: function(v) { //验证方法
                return /\d{3}-\d{3}-\d{4}/.test(v);
            },
            message: '{VALUE} is not a valid phone number!' //错误提示
        },
        required: [true, 'User phone number required'] // required验证
    }
});
// 自定义验证器也可以是异步的，如果你的验证器返回一个promise（如一个异步函数），mongoose会等待它完成，如果你喜欢回调函数，设置 isAsync 选项，就可以在验证函数中传入一个回调函数作为第二个参数
var userSchema = new Schema({
    name: {
        type: String,
        // You can also make a validator async by returning a promise. If you return a promise, do **not** specify the `isAsync` option.
        validate: function(v) { //返回一个promise表示验证器是异步的，这里不要设置 isAsync 选项
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    resolve(false);
                }, 5);
            });
        }
    },
    phone: {
        type: String,
        validate: {
            isAsync: true,
            validator: function(v, cb) { //设置了 isAsync:true 就可以设置第二个参数 cb（回调函数）
                setTimeout(function() {
                var phoneRegex = /\d{3}-\d{3}-\d{4}/;
                var msg = v + ' is not a valid phone number!';
                cb(phoneRegex.test(v), msg); //第一个参数表示是否验证成功，第二个参数可选的表示错误信息会覆盖默认错误信息
                }, 5);
            },
            message: 'Default error message' //默认错误信息，会被上面的cb()回调函数的第二个参数覆盖
        },
        required: [true, 'User phone number required']
    }
});
var User = mongoose.model('User', userSchema);
var user = new User();
var error;
user.phone = '555.0123';
user.name = 'test';
user.validate(function(error) {
    assert.ok(error);
    assert.equal(error.errors['phone'].message, '555.0123 is not a valid phone number!');
    assert.equal(error.errors['name'].message, 'Validator failed for path `name` with value `test`');
});


// 验证错误
// 当验证失败的时候会返回一个 ValidatorError 对象，包含 kind, path, value, 和 message 四个属性
var toySchema = new Schema({
    color: String,
    name: String
});
var validator = function(value) {
    return /red|white|gold/i.test(value);
};
toySchema.path('color').validate(validator, 'Color `{VALUE}` not valid', 'Invalid color');
toySchema.path('name').validate(function(v) {
    if (v !== 'Turbo Man') {
        throw new Error('Need to get a Turbo Man for Christmas');
    }
    return true;
    },
    'Name `{VALUE}` is not valid'
);
var Toy = mongoose.model('Toy', toySchema);
var toy = new Toy({ color: 'Green', name: 'Power Ranger' });
toy.save(function (err) {
    // `err` is a ValidationError object
    // `err.errors.color` is a ValidatorError object
    assert.equal(err.errors.color.message, 'Color `Green` not valid');
    assert.equal(err.errors.color.kind, 'Invalid color');
    assert.equal(err.errors.color.path, 'color');
    assert.equal(err.errors.color.value, 'Green');

    // This is new in mongoose 5. If your validator throws an exception,
    // mongoose will use that message. If your validator returns `false`,
    // mongoose will use the 'Name `Power Ranger` is not valid' message.
    assert.equal(err.errors.name.message, 'Need to get a Turbo Man for Christmas');
    assert.equal(err.errors.name.value, 'Power Ranger');
    // If your validator threw an error, the `reason` property will contain
    // the original error thrown, including the original stack trace.
    assert.equal(err.errors.name.reason.message, 'Need to get a Turbo Man for Christmas');

    assert.equal(err.name, 'ValidationError');
});


// 嵌入对象的 required 验证器
var personSchema = new Schema({
    name: {
        first: String,
        last: String
    }
});
assert.throws(function() {
    // This throws an error, because 'name' isn't a full fledged path
    personSchema.path('name').required(true); // 这里会出现错误，因为 name 不是 一个成熟的 path
    }, /Cannot.*'required'/
);

// To make a nested object required, use a single nested schema
var nameSchema = new Schema({
    first: String,
    last: String
});
personSchema = new Schema({
name: {
    type: nameSchema,  //使用子文档
    required: true     //这样就可以指定 required 了
}
});
var Person = mongoose.model('Person', personSchema);
var person = new Person();
var error = person.validateSync();
assert.ok(error.errors['name']);


// 更新验证器
// Mongoose 为 update() 和 findOneAndUpdate() 操作提供了 更新验证器，它默认是关闭的，你需要使用 runValidators 选项打开验证器执行
var toySchema = new Schema({
    color: String,
    name: String
});
var Toy = db.model('Toys', toySchema);
Toy.schema.path('color').validate(function (value) { //给color属性定义一个验证器
    return /blue|green|white|red|orange|periwinkle/i.test(value);
    }, 'Invalid color'
);
Toy.update({}, { color: 'bacon' }, { runValidators: true }, function (err) { //设置 runValidator 选项，当更新操作前会执行上面的验证器
    assert.equal(err.errors.color.message, 'Invalid color');
});


// 更新验证器的 this
// 更新验证器和普通文档验证器有一些不同，文档验证器中的 this 指向将要被验证的 document，更新验证器中的 document 可能还不在内存当中，所以 默认 this 是 undefined
var toySchema = new Schema({
    color: String,
    name: String
});
toySchema.path('color').validate(function(value) {
    // When running in `validate()` or `validateSync()`, the
    // validator can access the document using `this`.
    // Does **not** work with update validators.
    if (this.name.toLowerCase().indexOf('red') !== -1) { //这里的 this 不能用于更新验证器，否则会抛出异常
        return value !== 'red';
    }
    return true;
});
var Toy = mongoose.model('ActionFigure', toySchema);
var toy = new Toy({ color: 'red', name: 'Red Power Ranger' });
var error = toy.validateSync();
assert.ok(error.errors['color']);

var update = { color: 'red', name: 'Red Power Ranger' };
Toy.update({}, update, { runValidators: true }, function(error) {
    // The update validator throws an error:
    // "TypeError: Cannot read property 'toLowerCase' of undefined",
    // because `this` is **not** the document being updated when using
    // update validators
    assert.ok(error);
});


// context 上下文选项，可以让你在更新验证器中将 this 设置成潜在要使用的 query 对象
// acquit:ignore:start
var toySchema = new Schema({
    color: String,
    name: String
});
// acquit:ignore:end
toySchema.path('color').validate(function(value) {
    // When running update validators with the `context` option set to 'query', `this` refers to the query object.
    // getUpdate()例子：
    // var query = new Query();
    // query.update({}, { $set: { a: 5 } });
    // query.getUpdate(); // { $set: { a: 5 } }
    if (this.getUpdate().$set.name.toLowerCase().indexOf('red') !== -1) { //当运行更新验证时这里的 this 指向 query 对象，getUpdate()返回一个JSON对象表示当前query对象的更新操作部分 
        return value === 'red';
    }
    return true;
});
var Toy = mongoose.model('Figure', toySchema);
var update = { color: 'blue', name: 'Red Power Ranger' };
Toy.update({}, update, { runValidators: true, context: 'query' }, function(error) { //指定 context 选项
    assert.ok(error.errors['color']);
}); 


// 更新验证器 paths
// 更新验证器只会影响 update 上指定的 paths
var kittenSchema = new Schema({
  name: { type: String, required: true },
  age: Number
});
var Kitten = mongoose.model('Kitten', kittenSchema);
var update = { color: 'blue' };
Kitten.update({}, update, { runValidators: true }, function(err) {
  // 操作会成功 尽管 name 属性未指定值
});

var unset = { $unset: { name: 1 } }; //这里重置name 为 null，但是 name 是 required
Kitten.update({}, unset, { runValidators: true }, function(err) {
  // Operation fails because 'name' is required
  assert.ok(err);
  assert.ok(err.errors['name']);
});

// 更新验证器只会在以下操作符下起作用：
// $set
// $unset
// $push (>= 4.8.0)
// $addToSet (>= 4.8.0)
// $pull (>= 4.12.0)
// $pullAll (>= 4.12.0)
var testSchema = new Schema({
    number: { type: Number, max: 0 },
    arr: [{ message: { type: String, maxlength: 10 } }]
});
// Update validators won't check this, so you can still `$push` 2 elements
// onto the array, so long as they don't have a `message` that's too long.
testSchema.path('arr').validate(function(v) {
    return v.length < 2;
});
var Test = mongoose.model('Test', testSchema);
Test.update({}, { $inc: { number: 1 } }, { runValidators: true }, function(error) { //这里的操作会成功，因为更新验证器会忽略 $inc 操作符
    // There will never be a validation error here
    update = { $push: [{ message: 'hello' }, { message: 'world' }] };
    Test.update({}, update, { runValidators: true }, function(error) {
        // This will never error either even though the array will have at
        // least 2 elements.
    });
});
