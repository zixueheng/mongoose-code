const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

//定义模式
var catSchema = new mongoose.Schema({
    name: String
});
//给模式添加方法
catSchema.methods.speak = function(){ // NOTE: methods must be added to the schema before compiling it with mongoose.model()
    let greeting = this.name ? 'My name is ' + this.name : 'I dont\'t a name';
    console.log(greeting);
};
// 注意：方法定义不能使用箭头函数（箭头函数中的this不能正确指向对象本身）
// catSchema.methods.speak = () => { // NOTE: methods must be added to the schema before compiling it with mongoose.model()
//     let greeting = this.name ? 'My name is ' + this.name : 'I dont\'t a name';
//     console.log(greeting); //输出：I dont't a name
// };

//定义静态方法
catSchema.statics.findByName = function(name, callback){
    return this.find({name: new RegExp(name, 'i')}, callback);
};

//定义 query 助手
catSchema.query.byName = function(name,){
    return this.find({name: new RegExp(name, 'i')});
};
//使用模式定义模型
var catModel = mongoose.model('cat', catSchema); //mongoose.model(modelName, schema)


// var silence = new catModel({name: 'Silence'}); //实例化一个对象
// //console.log(silence.name);
// silence.save(function(err, silence){ //保存对象
//     if(err) throw Error('Save Error');
//     silence.speak();
// });

// var kitty = new catModel({name: 'Kitty'}); //实例化一个对象
// //console.log(silence.name);
// kitty.save(function(err, kitty){ //保存对象
//     if(err) throw Error('Save Error');
//     kitty.speak();
// });

// 使用静态方法 查找名称为‘Silence’的小猫
catModel.findByName('Silence', function(err, cats){
    console.log(cats); //输出：[ { _id: 5b18f33de592b216b8089bf6, name: 'Silence', __v: 0 } ]
});
// 使用 query helper 查找名称为‘Kitty’的小猫
catModel.find().byName('Kitty').exec(function(err, cats) {
    console.log(cats); //输出：[ { _id: 5b18f33de592b216b8089bf7, name: 'Kitty', __v: 0 } ]
});


