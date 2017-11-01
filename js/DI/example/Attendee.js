let Attendee = function(service, messenger, attendeeId) {
  this.service = service
  this.messenger = messenger
  this.attendeeId = attendeeId
}
/**
 * Attempt to reserve a seat at the given session
 * Give a message about success or failure
 * @param sessionId
 */
Attendee.prototype.reserve = function(sessionId) {
  if (this.service.reserve(this.attendeeId, sessionId)) {
    this.messenger.success('Great! Your seat has been reserved.')
  }
  else {
    this.messenger.failure('Sorry, your seat could not be reserved.')
  }
}

module.exports = Attendee
