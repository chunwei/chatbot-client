const DiContainer = require('../DiContainer')
const DemoWebService = require('./DemoWebService')
const DemoMessenger = require('./DemoMessenger')
const Attendee = require('./Attendee')

let MyApp = {}
MyApp.diContainer = new DiContainer()
MyApp.diContainer.register('Service', [], function() { return new DemoWebService() })
MyApp.diContainer.register('Messenger', [], function() { return new DemoMessenger() })
MyApp.diContainer.register('AttendeeFactory', ['Service', 'Messenger'], function(service, messenger) {
  return function(attendeeId) {
    return new Attendee(service, messenger, attendeeId)
  }
})


let attendeeId = 123,
  sessionId = 1
let attendee = MyApp.diContainer.get('AttendeeFactory')(attendeeId)
attendee.reserve(sessionId)
