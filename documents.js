const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose');

var schema = new mongoose.Schema({ name: 'string', size: 'string' });
var Tank = mongoose.model('Tank', schema);


// Mongoose 文档 一对一 对应于MongoDB中的文档，每一个文档是 model 的一个实例

// 查询请参考 querys 一节

// 更新，有很多更新的方法
Tank.findById(id, function (err, tank) { //根据id查找文档，找到了是 tank 对象
    if (err) return handleError(err);

    tank.size = 'large'; //重置 tank 的size属性
    //tank.set({ size: 'large' }); //这里也可以用Mongoose文档的 .set() 方法修改文档
    tank.save(function (err, updatedTank) { //保存更新
        if (err) return handleError(err);
        res.send(updatedTank);
    });
});
// 如果你仅仅想更新这个字段，而不想返回这个文档，你可以使用 model 的 update 方法
Tank.update({_id: id}, {$set: {size: 'large'}}, callback);
// 如果需要文档被返回，有一个更好的方法
Tank.findByIdAndUpdate(id, {$set: {size: 'large'}}, { new: true }, function(err, tank){ //{ new: true }选项指定回调函数返回的是修改后的文档，默认false返回原始文档
    if(err) throw new Error(err);
    res.send(tank); //tank就是返回的文档
});
// findAndUpdate/Remove 等静态方法只是更新至多一个文档
// 并且特别注意 findAndUpdate/Remove 在更改到数据库前不会执行任何挂载和验证（hooks or validation），你可以使用 { runValidators: true } 选项来指定要执行验证，如
Tank.update({_id: id}, {$set: {size: 'large'}}, { runValidators: true }, callback);
// 或者你要执行hooks 和全文档验证 请使用第一种 查询文档再save() 的方式
