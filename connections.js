const mongoose = require('mongoose');
// 参考：http://mongoosejs.com/docs/connections.html
// 连接示例
// mongoose.connect('mongodb://username:password@host:port/database?options...');


// 操作缓冲（Operation Buffering）
// Mongoose允许你立即使用你的models，不用等待mongoose正真的连接到MongoDB，这是因为Mongoose会在内部缓存所有models函数，这会导致models操作不会抛出任何错误在连接未完成前
var MyModel = mongoose.model('Test', new Schema({ name: String }));
MyModel.findOne(function(error, result) { /* ... */ }); //这里只会挂起直到Mongoose连接到数据库
setTimeout(function() {
  mongoose.connect('mongodb://localhost/myapp'); // 60秒后才开始连接数据库
}, 60000);
// 要禁用buffering，可以在你的Schema的Option上设置bufferCommands: false，如果要全局关闭buffering： mongoose.set('bufferCommands', false);


// Option
// const options = {
//     useMongoClient: true,
//     autoIndex: false, // Don't build indexes
//     reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
//     reconnectInterval: 500, // Reconnect every 500ms
//     poolSize: 10, // Maintain up to 10 socket connections
//     // If not connected, return errors immediately rather than waiting for reconnect
//     bufferMaxEntries: 0
// };
// mongoose.connect(uri, options);


// Callback 连接回调
mongoose.connect(uri, options, function(error) {
    // Check error in initial connection. There is no 2nd param to the callback.
});
// Or using promises
mongoose.connect(uri, options).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
    err => { /** handle initial connection error */ }
);


// keepAlive
// 如果是一个长期运行的应用，必须谨慎的设置keepAlive
// mongoose.connect(uri, { keepAlive: 120 }); //120毫秒后关闭连接 


// Replica Set Connections 集群集合连接
// mongoose.connect('mongodb://user:pw@host1.com:27017,host2.com:27017,host3.com:27017/testdb'); //用user:pwd连接到 host1 host2 host3 上的 testdb数据库
// mongoose.connect('mongodb://host1:port1/?replicaSet=rsName'); //连接到单节点的集群集合，要指定replicaSet 选项