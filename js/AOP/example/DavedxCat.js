var Aop = require('../Aop')

var Cat = function() {
  this.makeSound = function() {
    console.log('Meooowwww!')
  }
}

Cat.prototype.test = function() {
  console.log('test-proto')
}

var test = new Cat

Aop.before('test', function() {
  console.log('aop-test', arguments)
}, test)

Aop.before('makeSound', function() {
  console.log('aop-sound', arguments)
}, test)

test.makeSound(2, 56)
test.test()
