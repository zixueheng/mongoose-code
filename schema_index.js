const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');
// 创建索引，两种方式
var animalSchema = new Schema({
    name: String,
    type: String,
    tags: { type: [String], index: true } // field level
});
animalSchema.index({ name: 1, type: -1 }); // schema level

//开发阶段可以，部署后建议禁用，如下
// mongoose.connect('mongodb://user:pass@localhost:port/database', { autoIndex: false }); // or
// mongoose.createConnection('mongodb://user:pass@localhost:port/database', { autoIndex: false }); // or
// animalSchema.set('autoIndex', false); // or
// new Schema({/***/}, { autoIndex: false });

//创建索引完成或者产生错误会触发 index 事件
animalSchema.index({ _id: 1 }, { sparse: true }); //Will cause an error because mongodb has an _id index by default that is not sparse
var Animal = mongoose.model('Animal', animalSchema);
Animal.on('index', function(error) {
    // "_id index cannot be sparse"
    console.log(error.message);
});
  