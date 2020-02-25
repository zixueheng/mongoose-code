const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var schema = new mongoose.Schema({ name: 'string', size: 'string' });
var Tank = mongoose.model('Tank', schema);
// Mongoose会自动寻找第一个参数的 复数形式 的collection，所以模型Thank实际对应数据库中的 Tanks 集合
// .model()实际是 schema 的副本，所以要在调用 .model()前定义好所有的 schema


// model的实例叫做文档（document），你可以创建他们并保存到数据库
small.save(function (err, samll) {  //然后保存它，回调函数可以处理错误或者进行保存成功后的操作
    if (err) return handleError(err);
    console.log(samll); // { _id: 5b2320d567178a1b88858fff, size: 'small', __v: 0 }
});

// 或者 调用model的 create 方法
Tank.create({ size: 'big' }, function (err, big) {
    if (err) return handleError(err);
    console.log(big); // { _id: 5b2320d567178a1b88859000, size: 'big', __v: 0 }
});

// 或者批量插入文档
Tank.insertMany([{ size: 'large' }, { size: 'huge' }], function(err, data) {
    if (err) return handleError(err);
    console.log(data);
});
// [ { _id: 5b2320d567178a1b88859001, size: 'large', __v: 0 },
//   { _id: 5b2320d567178a1b88859002, size: 'huge', __v: 0 } ]


// 如果需要连接其他数据库，要使用对应的 连接的 model()方法
var connection = mongoose.createConnection('mongodb://localhost:27017/test');
var another_model = connection.model('Tank',schema);


// 查询 可以使用model 的  find, findById, findOne, or where 等静态方法
Tank.find({ size: 'small' }).where('createdDate').gt(oneYearAgo).exec(callback);


// 删除 可以调用 model 的 deleteOne 或者 deleteMany 静态方法删除所有符合条件的 文档
Tank.deleteOne({ size: 'large' }, function (err) {
    if (err) return handleError(err);
    // deleted at most one tank document
});


// 更新  update() updateMany() updateOne()
Tank.updateOne({ size: 'large' }, { name: 'T-90' }, function(err, res) { //查找 size: 'large' 的第一条记录，把它的 name 改成 T-90
    // Updated at most one doc, `res.modifiedCount` contains the number
    // of docs that MongoDB updated
});


//Change Streams 是一种监听插入更新的方式，当数据库有变化时会触发定义的函数，是个异步操作
async function run() {
    const personSchema = new mongoose.Schema({ // Create a new mongoose model
        name: String
    });
    const Person = mongoose.model('Person', personSchema, 'Person');

    // Create a change stream. The 'change' event gets emitted when there's a
    // change in the database
    Person.watch().
        on('change', data => console.log(new Date(), data));

    console.log(new Date(), 'Inserting doc');
    await Person.create({ name: 'Axl Rose' }); //插入一个文档，会触发上面定义的处理函数
}
// 监听到的 data 格式如下：
// { _id: { _data: ... },
//   operationType: 'insert',
//   fullDocument: { _id: 5af5b13fe526027666c6bf83, name: 'Axl Rose', __v: 0 },
//   ns: { db: 'test', coll: 'Person' },
//   documentKey: { _id: 5af5b13fe526027666c6bf83 } }