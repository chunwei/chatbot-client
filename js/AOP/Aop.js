let Aop = {}
Aop.around = function(fnName, advice, targetObj) {
  let originalFn = targetObj[fnName]
  targetObj[fnName] = function() {
    return advice.call(this, { fn: originalFn, args: arguments })
  }
}
Aop.next = function(targetInfo) {
  return targetInfo.fn.apply(this, targetInfo.args)
}

Aop.before = function(fnName, advice, targetObj) {
  Aop.around(fnName, function(f) {
    advice.apply(this, f.args)
    return Aop.next.call(this, f)

  }, targetObj)
}
Aop.after = function(fnName, advice, targetObj) {
  Aop.around(fnName, function(f) {
    let ret = Aop.next.call(this, f)
    advice.apply(this, f.args)
    return ret
  }, targetObj)
}

module.exports = Aop
