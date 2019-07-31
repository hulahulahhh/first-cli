const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path')
const Creator = require('./Creator')

async function create (projectName, options) {
    const  cwd = options.cwd || process.cwd();
    console.log(cwd);
    
    const targetDir = path.resolve(cwd, projectName || '.' )
    
    const creator = new Creator();
}

module.exports = create

// vue-cli 里面为什么要这么写：
// 这样写可以捕捉错误吗
// module.exports = (...args) => {
//       这样给函数传参。不是让第一个参数传了一个数组吗
//     return create(...args).catch(()=>{
//         xxxx
//     })
// }