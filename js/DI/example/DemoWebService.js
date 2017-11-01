let DemoWebService = function() {}
DemoWebService.prototype.reserve = function(attendeeId, sessionId) {
  console.log(`interactions with a web service to reserve seat for attendee id(${attendeeId}) at session Id(${sessionId})`)
  return true
}
module.exports = DemoWebService
