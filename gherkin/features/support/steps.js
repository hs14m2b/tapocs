const assert = require('assert')
const { When, Then, Given } = require('@cucumber/cucumber')
const { Greeter, DynamicGreeter } = require('../../src/Greeter')

Given('my name is {string}', function(name){
  this.dynamicGreeter = new DynamicGreeter(name);
});

When('the dynamic greeter says hello', function () {
  this.whatIHeard = this.dynamicGreeter.sayHello()
});

When('the greeter says hello', function () {
  this.whatIHeard = new Greeter().sayHello()
});

Then('I should have heard {string}', function (expectedResponse) {
  assert.equal(this.whatIHeard, expectedResponse)
});