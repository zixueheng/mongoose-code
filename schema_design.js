//MongoDB 数据设计模式
//一对多有三种基本的设计方式
//参考：https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design-part-1

// 一、内嵌形式 embedding
// 示例：个人的地址：
// {
//   name: 'Kate Monster',
//   ssn: '123-456-7890',
//   addresses : [
//      { street: '123 Sesame St', city: 'Anytown', cc: 'USA' },
//      { street: '123 Avenue Q', city: 'New York', cc: 'USA' }
//   ]
// }


// 二、子数组引用 child-referencing
// 示例：产品的零部件（一个产品的零部件个数是有限的，不会无限多）
// > db.parts.findOne() //查找一个零部件
// {
//     _id : ObjectID('AAAA'),
//     partno : '123-aff-456',
//     name : '#4 grommet',
//     qty: 94,
//     cost: 0.94,
//     price: 3.99
// > db.products.findOne() //查找一个产品
// {
//     name : 'left-handed smoke shifter',
//     manufacturer : 'Acme Corp',
//     catalog_number: 1234,
//     parts : [     // array of references to Part documents
//         ObjectID('AAAA'),    // reference to the #4 grommet above
//         ObjectID('F17C'),    // reference to a different Part
//         ObjectID('D2AA'),
//         // etc
//     ]

// > product = db.products.findOne({catalog_number: 1234}); //查找某个产品
// > product_parts = db.parts.find({_id: { $in : product.parts } } ).toArray() ; //查找上面产品所有的零部件

// 三、父引用 parent-referencing
// 示例：主机日志（每个主机会产生大量日志，如果用内嵌形式肯定不行，因为单个文档大小肯定超过16M，及时使用第二种内嵌ID数组的形式也不行）
// > db.hosts.findOne() //查找一个主机
// {
//     _id : ObjectID('AAAB'),
//     name : 'goofy.example.com',
//     ipaddr : '127.66.66.66' //这里要建唯一索引
// }

// >db.logmsg.findOne() //日志单独建立集合存放
// {
//     time : ISODate("2014-03-28T09:42:41.382Z"),
//     message : 'cpu is on fire!',
//     host: ObjectID('AAAB')       // 指向主机文档
// }

// > host = db.hosts.findOne({ipaddr : '127.66.66.66'}); //查找某个主机
// > last_5k_msg = db.logmsg.find({host: host._id}).sort({time : -1}).limit(5000).toArray() //查找上面主机近5000条日志


//进阶模式 参考：https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design-part-2
// 一、双向引用 Two-Way Referencing
// 双向引用是既从一这边引用多，也从多引用一
// 示例：个人任务系统（一个人有多个任务，一个任务分属一个人）
// db.person.findOne() //查找一个人
// {
//     _id: ObjectID("AAF1"),
//     name: "Kate Monster",
//     tasks [     // 任务数组
//         ObjectID("ADF9"),  //指向任务
//         ObjectID("AE02"),
//         ObjectID("AE73") 
//         // etc
//     ]
// }

// db.tasks.findOne() //查找一个任务
// {
//     _id: ObjectID("ADF9"), 
//     description: "Write lesson plan",
//     due_date:  ISODate("2014-04-01"),
//     owner: ObjectID("AAF1")     // 指向一个人
// }
// 这样设计的好处是既能查找到一个人的所有任务，也能快速定位某个任务是分属哪个人的；坏处是如果你要重新分配某个任务给其他人，就要执行两次更新操作，
// 所以使用的设计表明你可能不需要重新改变他们的对应关系

// 二、非规范化一对多关联 Denormalizing With “One-To-Many” Relationships
// (1) Denormalizing from Many -> One
// > db.products.findOne() //查找一个人
// {
//     name : 'left-handed smoke shifter',
//     manufacturer : 'Acme Corp',
//     catalog_number: 1234,
//     parts : [
//         { id : ObjectID('AAAA'), name : '#4 grommet' },         // Part name is denormalized
//         { id: ObjectID('F17C'), name : 'fan blade assembly' },
//         { id: ObjectID('D2AA'), name : 'power switch' },
//         // etc
//     ]
// }
// 可以看到parts数组不止只有关联零部件的id，还有零部件的name属性，这意味着当你只需要知道零部件的名称时你可以避免应用层面的join操作，但是如果要知道更多零部件信息 还是要进行join操作
// 这里隐含的一个坏处是如果一个零部件的name改变了，你还得到引用了这个零部件的产品当中去更新parts.name
// 所以这种设计只是在 频繁的读取 而 非常低概率的更新 的时候才有价值，以牺牲更新的性能来换取非常更加快速的读取，在这里通常name更新是比较少的，而qty更新可能比较多，这样设计就比较合理

// > product = db.products.findOne({catalog_number: 1234});  //查找某个产品
// > part_ids = product.parts.map( function(doc) { return doc.id } ); //用map函数返回零部件ID数组 part_ids
// > product_parts = db.parts.find({_id: { $in : part_ids } } ).toArray() ; //查找这个产品的所有零部件

// (2) Denormalizing from One -> Many
// > db.parts.findOne() //查找一个零部件
// {
//     _id : ObjectID('AAAA'),
//     partno : '123-aff-456',
//     name : '#4 grommet',
//     product_name : 'left-handed smoke shifter',   // Denormalized from the ‘Product’ document
//     product_catalog_number: 1234,                     // Ditto
//     qty: 94,
//     cost: 0.94,
//     price: 3.99
// }
// 当你更新产品名称的时候就需要更新每个引用了这个产品名的所有零部件，这里的更新可能是比较快的


// Denormalizing With “One-To-Squillions” Relationships
// > db.logmsg.findOne()
// {
//     time : ISODate("2014-03-28T09:42:41.382Z"),
//     message : 'cpu is on fire!',
//     ipaddr : '127.66.66.66', //这里将主机集合(One Side)中的ipaddr字段放到日志(Squillions side)当中
//     host: ObjectID('AAAB')
// }
// > last_5k_msg = db.logmsg.find({ipaddr : '127.66.66.66'}).sort({time : -1}).limit(5000).toArray() //所以根据IP查询日志就会变的很简单
// 实际上，如果One Side这边只有有限的信息，你可以将One这边的所有信息放在Squillions Side，从而移除One 集合
// > db.logmsg.findOne()
// {
//     time : ISODate("2014-03-28T09:42:41.382Z"),
//     message : 'cpu is on fire!',
//     ipaddr : '127.66.66.66', //IP from One Side
//     hostname : 'goofy.example.com', //hostname from One Side
// }

// 当你决定使用denormalize，请考虑两个因素：1、你已经不能在 denormalized 数据上 执行原子操作了；2、Denormalization 只是针对有大量读少量写的场景。

// 6个设计规则 参考：https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design-part-3
// 1、更倾向于嵌入除非有足够的理由不这么做
// 2、需要独立访问的对象不应该嵌入到其他对象
// 3、数组不应该无限增长，如果在Many Side（多这边）有好几百个文档不要嵌入他们（这里可以使用ObjectID数组引用），如果在Many Side（多这边）有好几千个文档不要使用ObjectID数组引用
// 4、不要担心应用层的join操作，如果你恰当的使用索引并且使用projection specifier（这里是限制查询的字段），它很少比服务端关系数据库低效
// 5、当你使用denormalizing的时候要考虑读写比例，如果一个字段频繁的读，很少写 它就比较适合denormalizing
// 6、如何设计的数据结构，必须整体考虑你的应用，考虑你应用如何读写数据才能设计合理的数据结构

// 对于 One-To-Few 你可以用一个数组嵌入文档
// 对于 One-To-Many 关键在于N端是否要独立访问，你可以使用数组引用，也可以在N端使用父引用如果这能优化你的数据访问模式
// 对于 one-to-squillions 你必须在N端使用父引用