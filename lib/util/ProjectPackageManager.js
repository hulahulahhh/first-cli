const SUPPORTED_PACKAGE_MANAGERS = ['yarn', 'pnpm', 'npm']
const { executeCommand } = require('./executeCommand')
const minimist = require('minimist')
const execa = require('execa')

const PACKAGE_MANAGER_CONFIG = {
    npm: {
        install: ['install', '--loglevel', 'error'],
        add: ['install', '--loglevel', 'error'],
        upgrade: ['update', '--loglevel', 'error'],
        remove: ['uninstall', '--loglevel', 'error']
    }
}

class PackageManager {
    constructor({ context, forcePackageManager } = {}) {
        this.context = context

        // if (forcePackageManager) {
        //   this.bin = forcePackageManager
        // } else if (context) {
        //   this.bin = hasProjectYarn(context) ? 'yarn' : hasProjectPnpm(context) ? 'pnpm' : 'npm'
        // } else {
        //   this.bin = loadOptions().packageManager || (hasYarn() ? 'yarn' : hasPnpm3OrLater() ? 'pnpm' : 'npm')
        // }
        this.bin = 'npm'

        if (!SUPPORTED_PACKAGE_MANAGERS.includes(this.bin)) {
            throw new Error(`Unknown package manager: ${this.bin}`)
        }
    }

    async install() {
        const args = await this.addRegistryToArgs(PACKAGE_MANAGER_CONFIG[this.bin].install)
        return executeCommand(this.bin, args, this.context)
    }

    async addRegistryToArgs(args) {
        const registry = await this.getRegistry()
        args.push(`--registry=${registry}`)

        // if (registry === registries.taobao) {
        //     args.push(`--disturl=${TAOBAO_DIST_URL}`)
        // }

        return args
    }

    // Any command that implemented registry-related feature should support
    // `-r` / `--registry` option
    async getRegistry() {
        if (this._registry) {
            return this._registry
        }

        const args = minimist(process.argv, {
            alias: {
                r: 'registry'
            }
        })

        // if (args.registry) {
        //     this._registry = args.registry
        // } else if (await shouldUseTaobao(this.bin)) {
        //     this._registry = registries.taobao
        // } else {
        //     const { stdout } = await execa(this.bin, ['config', 'get', 'registry'])
        //     this._registry = stdout
        // }

        if (args.registry) {
            this._registry = args.registry
        }  else {
            const { stdout } = await execa(this.bin, ['config', 'get', 'registry'])
            this._registry = stdout
        }

        return this._registry
    }
}

module.exports = PackageManager