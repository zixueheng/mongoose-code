const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

//虚拟属性主要用于 setter getter，并不会保存到数据库
var personSchema = new mongoose.Schema({
    last_name: String,
    first_name: String
});

//定义 full_name 虚拟属性 的 getter 方法
personSchema.virtual('full_name').get(function(){
    return this.last_name + ' ' + this.first_name;
});
//定义 full_name 虚拟属性 的 setter 方法
personSchema.virtual('full_name').set(function(name){
    this.last_name = name.substr(0, name.indexOf(' '));
    this.first_name = name.substr(name.indexOf(' ')+1);
});

var personModel = mongoose.model('person', personSchema);

var person1 = new personModel({last_name:'Yongliang', first_name:'He'});

console.log(person1.full_name); // Yongliang He，调用的 getter

person1.full_name = 'Jack Jones'; //重置 full_name 即调用 setter 

console.log(person1.full_name); //Jack Jones

//只有非虚拟属性才能用在查询当中，这是因为虚拟属性不会保存到数据库当中


//字段别名，数据库用短字段名，别名用长字段名，主要用来节省带宽
var personSchema = new Schema({
    n: { //数据库中是字段名是n，类型是String，别名是name
        type: String,
        // Now accessing `name` will get you the value of `n`, and setting `n` will set the value of `name`
        alias: 'name'
    }
});
// Setting `name` will propagate to `n`
var person = new Person({ name: 'Val' });
console.log(person); // { n: 'Val' }
console.log(person.toObject({ virtuals: true })); // { n: 'Val', name: 'Val' }
console.log(person.name); // "Val"

person.name = 'Not Val';
console.log(person); // { n: 'Not Val' }
  