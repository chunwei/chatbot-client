let DiContainer = function() {
  this.registrations = {}
}
DiContainer.prototype.messages = {
  registerRequiresArgs: `The register function requires three arguments: 
  a string, an array of string and a function`
}
DiContainer.prototype.register = function(name, dependencies, func) {
  if (arguments.length !== 3 ||
    typeof name !== 'string' || !Array.isArray(dependencies) ||
    typeof func !== 'function'
  ) {
    throw new Error(this.messages.registerRequiresArgs)
  }
  for (let i = 0; i < dependencies.length; i++) {
    if (typeof dependencies[i] !== 'string') {
      throw new Error(this.messages.registerRequiresArgs)
    }
  }
  this.registrations[name] = { func: func, dependencies: dependencies }
}
DiContainer.prototype.get = function(name) {
  let d = this.registrations[name]
  if (!d) return undefined
  let deps = d.dependencies.map((depName) => {
    return this.get(depName)
  })
  return d.func.apply(this, deps)
}
module.exports = DiContainer
