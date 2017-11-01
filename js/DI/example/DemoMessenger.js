let Messenger = function() {}
Messenger.prototype.success = function(message) { console.log(message) }
Messenger.prototype.failure = function(message) { console.error(message) }

module.exports = Messenger
