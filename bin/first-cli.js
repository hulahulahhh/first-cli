#!/usr/bin/env node
const program = require('commander');

program
    .version(require('../package').version)
    .usage('<command> [options]')

program
    .command('create <app-name>')
    .description('create a new project powered by first-cli-service')
    .option('-d, --default', 'Skip prompts and use default preset')
    .action((name, cmd) => {
        // name是创建的项目名称
        const options = cleanArgs(cmd)

        require('../lib/create')(name, options)    
    })

function camelize (str) {
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

function cleanArgs(cmd) {
    const args = {}
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''))
        // if an option is not present and Command has a method with the same name
        // it should not be copied
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    })
  return args
}

// 解析命令行参数
program.parse(process.argv)
