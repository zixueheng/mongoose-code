const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var Schema = mongoose.Schema;

// 子文档（Subdocuments）可以嵌入其他的文档，Mongoose有两种类型的嵌入式文档：数组类型的子文档（Array of subdocuments），单嵌入式子文档（Single nested subdocuments）
var childSchema = new Schema({ name: String});
var parentSchema = new Schema({
    children : [childSchema], // Array of subdocuments
    child: childSchema // Single nested subdocuments
});
// 子文档和普通文档类似。嵌入的schemas可以有自己的中间件（middleware）、自定义的验证逻辑（custom validation logic）、虚拟属性（virtuals）和其他顶级schemas的属性。
// 主要的区别是子文档不能独立保存，当父文档保存的时候子文档才能同步保存
var Parent =  mongoose.model('parent', parentSchema);
var parent1 = new Parent({
    children : [{ name: 'Matt' }, { name: 'Sarah' }]
});
parent1.children[0].name = 'Matthew'; 
// `parent.children[0].save()` is a no-op, it triggers middleware but does **not** actually save the subdocument. You need to save the parent doc.
console.log(parent1);
// { _id: 5b287532a4a4a635ec4f3d38,
//     children:
//      [ { _id: 5b287532a4a4a635ec4f3d3a, name: 'Matthew' },
//        { _id: 5b287532a4a4a635ec4f3d39, name: 'Sarah' } ] }
parent1.save(function(err, data){});


// 子文档也有自己 save validate 中间件方法，当再父文档上调用 save() 方法会触发它的所有子文档的 save() 方法，同样 validate() 方法也是一样的
childSchema.pre('save', function(next){ //在文档上为save()方法 定义一个 pre hook
    if(this.name == 'invalid'){ // 如果名称是 invalid 则传给 Error
        return next(new Error('#sadpanda'));
    }
    next(); //继续下一个 中间件
});
var parent2 = new Parent({ children: [{ name: 'invalid' }] });
parent2.save(function (err) { //保存父文档时会触发子文档save()上定义的hook
  console.log(err.message) // #sadpanda
});
// 子文档的 pre('save') 和 pre('validate') 中间件的执行是 在父文档的 pre('save') 之前执行，但是在 父文档的 pre('validate') 之后执行，这是因为验证是在保存之前，所以执行顺序：
// 1、父文档 pre('validate')
// 2、子文档 pre('validate')
// 3、子文档 pre('save')
// 4、父文档 pre('save')


// 查找子文档
// 每个子文档默认有个 _id 属性，Mongoose文档数组有个 id() 方法用来在 数组中 查找文档
// var doc = parent.children.id(_id); //用指定的 _id 在子文档中查找


// 添加子文档到数组中
var parent3 = new Parent;
parent3.children.push({ name: 'Liesl' }); //往数组中添加元素
parent3.children.push({ name: 'Kitty' }); //往数组中添加元素
var subdocs = parent3.children[0];
console.log(subdocs); //{ _id: 5b28bc65685de109acdc104d, name: 'Liesl' }
console.log(subdocs.isNew); //true, 布尔值标识文档是不是新的
parent3.save(function(err, data){
    if(err) throw new Error('Save Error');
    console.log('Saved!');
});


// 删除子文档
// 每个子文档都有它的删除方法。对于子文档数组（array subdocument），这等同于在子文档上面调用 pull()方法，对于单嵌入式文档（ single nested subdocument） remove() 等同于 将这个子文档设置成 null
// parent3.children.id(_id).remove(); //等同于 parent3.children.pull(_id);
// parent3.child.remove(); //等同于 parent3.child = null;

// 如果你在子文档上用对象数组，Mongoose会自动将其转化成 Schema对象
// var parentSchema = new Schema({
//     children: [{name: String}]
// });
// 等同于
// var parentSchema = new Schema({
//     children: [new Schema({name: String})]
// });