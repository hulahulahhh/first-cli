const EventEmitter = require('events')
const PromptModuleAPI = require('./PromptModuleAPI')
const execa = require('execa')
const debug = require('debug')
const inquirer = require('inquirer')
const semver = require('semver')
// const getVersions = require('./util/getVersion')
const cloneDeep = require('lodash.clonedeep')
const writeFileTree = require('./util/writeFileTree')
const PackageManager = require('./util/ProjectPackageManager')

const isManualMode = answers => answers.preset === '__manual__'


module.exports = class Creator extends EventEmitter {
    constructor(name, context, promptModules) {
        super();

        this.name = name;
        this.context = process.env.FIRST_CLI_CONTEXT = context;

        const { presetPrompt, featurePrompt } = this.resolveIntroPrompts();
        this.presetPrompt = presetPrompt
        this.featurePrompt = featurePrompt
        this.outroPrompts = this.resolveOutroPrompts()
        this.injectedPrompts = []
        this.promptCompleteCbs = []
        this.afterInvokeCbs = []
        this.afterAnyInvokeCbs = []

        this.run = this.run.bind(this)

        const promptAPI = new PromptModuleAPI(this)
        promptModules.forEach(m => m(promptAPI))
    }

    async create(cliOptions = {}, preset = null) {
        const { name, context, run } = this
        preset = await this.promptAndResolvePreset();
        // clone before mutating
        preset = cloneDeep(preset)
        // inject core service
        preset.plugins['@vue/cli-service'] = Object.assign({
            projectName: name
        }, preset)

        if (cliOptions.bare) {
            preset.plugins['@vue/cli-service'].bare = true
        }

        // legacy support for router
        if (preset.router) {
            preset.plugins['@vue/cli-plugin-router'] = {}

            if (preset.routerHistoryMode) {
                preset.plugins['@vue/cli-plugin-router'].historyMode = true
            }
        }

        // legacy support for vuex
        if (preset.vuex) {
            preset.plugins['@vue/cli-plugin-vuex'] = {}
        }

        // const packageManager = (
        //     cliOptions.packageManager ||
        //     loadOptions().packageManager ||
        //     (hasYarn() ? 'yarn' : null) ||
        //     (hasPnpm3OrLater() ? 'pnpm' : 'npm')
        // )
        const packageManager = 'npm';
        const pm = new PackageManager({ context, forcePackageManager: packageManager })

        // get latest CLI version
        // const { current, latest } = await getVersions()
        const current = '4.0.0-beta.1';
        const latest = '4.0.0-beta.1';
        let latestMinor = `${semver.major(latest)}.${semver.minor(latest)}.0`

        // if using `next` branch of cli
        if (semver.gte(current, latest) && semver.prerelease(current)) {
            latestMinor = current
        }
        // generate package.json with plugin dependencies
        const pkg = {
            name,
            version: '0.1.0',
            private: true,
            devDependencies: {}
        }
        const deps = Object.keys(preset.plugins)
        deps.forEach(dep => {
            if (preset.plugins[dep]._isPreset) {
                return
            }

            // Note: the default creator includes no more than `@vue/cli-*` & `@vue/babel-preset-env`,
            // so it is fine to only test `@vue` prefix.
            // Other `@vue/*` packages' version may not be in sync with the cli itself.
            pkg.devDependencies[dep] = (
                preset.plugins[dep].version ||
                ((/^@vue/.test(dep)) ? `^${latestMinor}` : `latest`)
            )
        })

        // write package.json
        await writeFileTree(context, {
            'package.json': JSON.stringify(pkg, null, 2)
        })

        // 初始化git
        this.emit('creation', { event: 'git-init' })
        await run('git init')

        // install plugins
        await pm.install()
    }

    run(command, args) {
        if (!args) { [command, ...args] = command.split(/\s+/) }
        return execa(command, args, { cwd: this.context })
    }

    resolveIntroPrompts() {
        const presets = {}
        const presetChoices = []
        const presetPrompt = {
            name: 'preset',
            type: 'list', // 提示符的类型
            message: `Please pick a preset:`,
            choices: [
                ...presetChoices,
                {
                    name: 'Manually select features',
                    value: '__manual__'
                }
            ]
        }
        const featurePrompt = {
            name: 'features',
            when: isManualMode,
            type: 'checkbox',
            message: 'Check the features needed for your project:',
            choices: [],
            pageSize: 10
        }
        return {
            presetPrompt,
            featurePrompt
        }
    }
    resolveOutroPrompts() {
        const outroPrompts = [
            {
                name: 'useConfigFiles',
                when: isManualMode,
                type: 'list',
                message: 'Where do you prefer placing config for Babel, PostCSS, ESLint, etc.?',
                choices: [
                    {
                        name: 'In dedicated config files',
                        value: 'files'
                    },
                    {
                        name: 'In package.json',
                        value: 'pkg'
                    }
                ]
            },
            {
                name: 'save',
                when: isManualMode,
                type: 'confirm',
                message: 'Save this as a preset for future projects?',
                default: false
            },
            {
                name: 'saveName',
                when: answers => answers.save,
                type: 'input',
                message: 'Save preset as:'
            }
        ]

        return outroPrompts
    }

    async promptAndResolvePreset(answers = null) {
        // prompt
        if (!answers) {
            //   await clearConsole(true)
            answers = await inquirer.prompt(this.resolveFinalPrompts())
        }
        debug('first-cli:answers')(answers)

        // if (answers.packageManager) {
        //   saveOptions({
        //     packageManager: answers.packageManager
        //   })
        // }

        let preset
        if (answers.preset && answers.preset !== '__manual__') {
            preset = await this.resolvePreset(answers.preset)
        } else {
            // manual
            preset = {
                useConfigFiles: answers.useConfigFiles === 'files',
                plugins: {}
            }
            answers.features = answers.features || []
            // run cb registered by prompt modules to finalize the preset
            this.promptCompleteCbs.forEach(cb => cb(answers, preset))
        }

        // // validate
        // validatePreset(preset)

        // // save preset
        // if (answers.save && answers.saveName) {
        //   savePreset(answers.saveName, preset)
        // }

        // debug('vue-cli:preset')(preset)
        return preset
    }

    resolveFinalPrompts() {
        // patch generator-injected prompts to only show in manual mode
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = answers => {
                return isManualMode(answers) && originalWhen(answers)
            }
        })
        const prompts = [
            this.presetPrompt,
            this.featurePrompt,
            ...this.injectedPrompts,
            ...this.outroPrompts
        ]
        debug('first-cli:prompts')(prompts)
        return prompts
    }
}