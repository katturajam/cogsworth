'use strict'

var test = require('ava').test
var factory = require('./helpers/factory')
var bb = require('bluebird')

var SimpleTrigger = require('../../trigger').SimpleTrigger
var TriggerRrule = require('../../trigger-rrule/')
var TriggerCron = require('../../trigger-cron/')

test('tourist payload emitted', function (t) {
  var tourist = { test: 2 }
  return factory({ schedules: [
    {
      id: 'simple_test',
      trigger: new SimpleTrigger({ timeout: 1 }),
      tourist
    }
  ]})
  .then(scheduler => scheduler.start())
  .then(obs => obs.forEach(schedule => {
    t.deepEqual(schedule.tourist, tourist, 'tourist goes in, tourist comes out')
  }))
})

test('rrule triggers', function (t) {
  var aTicks = 2
  var bTicks = 4
  var expectedTicks = aTicks + bTicks
  var scheduler
  var schedules = [
    {
      id: 'rrule_test_a',
      trigger: new TriggerRrule({ rrule: 'FREQ=SECONDLY;COUNT=' + aTicks })
    },
    {
      id: 'rrule_test_b',
      trigger: new TriggerRrule({ rrule: 'FREQ=SECONDLY;INTERVAL=2;COUNT=' + bTicks })
    }
  ]
  var ticks = 0
  var aEmissions = 0
  var bEmissions = 0
  t.plan(3)
  return factory({ schedules: schedules })
  .then(function (sched) {
    scheduler = sched
    return sched.start()
  })
  .then(function (observable) {
    var chain = observable
    .forEach(function (schedule) {
      ++ticks
      if (schedule.id === schedules[0].id) ++aEmissions
      else if (schedule.id === schedules[1].id) ++bEmissions
      else throw new Error('unable to determine emitted schedule')
    })
    return chain
  })
  .then(function () { return bb.delay(50) })
  .then(function (res) {
    scheduler.stop()
    t.is(ticks, expectedTicks, 'rrule ticks per expectation')
    t.is(aEmissions, aTicks, 'rrule ticks per expectation on trigger a')
    t.is(bEmissions, bTicks, 'rrule ticks per expectation on trigger b')
  })
})

test('cron triggers', function (t) {
  var aTicks = 9
  var bTicks = 4
  var cronDuration = 10000 // ms
  var expectedTicks = aTicks + bTicks
  var t1 = new Date(Date.now() + 100)
  var t2 = new Date(t1.getTime() + cronDuration)
  var schedules = [
    {
      id: 'cron_test_a',
      trigger: new TriggerCron({
        cron: '* * * * * *',
        startDate: t1,
        endDate: t2
      })
    },
    {
      id: 'cron_test_b',
      trigger: new TriggerCron({
        cron: '*/2 * * * * *',
        startDate: new Date(t1 - 100),
        endDate: t2
      })
    }
  ]
  var aEmissions = 0
  var bEmissions = 0
  var ticks
  t.plan(3)
  return factory({ schedules: schedules })
  .then(function (sched) {
    return sched.start()
  })
  .then(function (observable) {
    return observable.forEach(function (schedule) {
      ++ticks
      if (schedule.id === schedules[0].id) ++aEmissions
      else if (schedule.id === schedules[1].id) ++bEmissions
      else throw new Error('unable to determine emitted schedule')
    })
  })
  .then(() => bb.delay(20))
  .then(function () {
    t.truthy((expectedTicks - 1) < ticks < (expectedTicks + 1), 'cron ticks per expectation')
    t.truthy((aTicks - 1) < aEmissions < (aTicks + 1), 'cron ticks per expectation on trigger a')
    t.truthy((bTicks - 1) < bEmissions < (bTicks + 1), 'cron ticks per expectation on trigger b')
  })
})

test('long running triggers', function (t) {
  var scheduler
  var schedules = [
    {
      id: 'forever_trigger_schedule',
      trigger: new TriggerRrule({ rrule: 'FREQ=SECONDLY' })
    }
  ]
  var ticks = 0
  t.plan(1)
  return factory({ schedules: schedules })
  .then(function (sched) {
    scheduler = sched
    return sched.start()
  })
  .then(function (observable) {
    observable.forEach(function (schedule) {
      ++ticks
    })
  })
  .then(function () { return bb.delay(2000) })
  .then(function () {
    scheduler.stop()
    t.truthy(2 < ticks <= 3, 'rrule ticks per expectation') // eslint-disable-line
  })
})
