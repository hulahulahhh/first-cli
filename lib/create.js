const path = require('path')
const Creator = require('./Creator')
const { getPromptModules } = require('./util/createTool')

async function create (projectName, options) {
    const  cwd = options.cwd || process.cwd();
    // 判断是否在当前目录 可是projectName显然不会为‘.’啊
    const inCurrent = projectName === '.'

    const targetDir = path.resolve(cwd, projectName || '.' )

    try {
    const creator = new Creator(projectName, targetDir, getPromptModules());
    await creator.create(options)
        
    } catch (error) {
        console.log(error);
        
    }
    
}

module.exports = (...args) => {
    return create(...args).catch(()=>{})
}

// vue-cli 里面为什么要这么写：
// 这样写可以捕捉错误吗
// module.exports = (...args) => {
//       这样给函数传参。不是让第一个参数传了一个数组吗
//     return create(...args).catch(()=>{
//         xxxx
//     })
// }