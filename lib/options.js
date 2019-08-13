let cachedOptions

exports.loadOptions = () => {
  if (cachedOptions) {
    return cachedOptions
  }
//   if (fs.existsSync(rcPath)) {
//     try {
//       cachedOptions = JSON.parse(fs.readFileSync(rcPath, 'utf-8'))
//     } catch (e) {
//       error(
//         `Error loading saved preferences: ` +
//         `~/.vuerc may be corrupted or have syntax errors. ` +
//         `Please fix/delete it and re-run vue-cli in manual mode.\n` +
//         `(${e.message})`,
//       )
//       exit(1)
//     }
//     validate(cachedOptions, schema, () => {
//       error(
//         `~/.vuerc may be outdated. ` +
//         `Please delete it and re-run vue-cli in manual mode.`
//       )
//     })
//     return cachedOptions
//   } else {
//     return {}
//   }
}