class Greeter {
    constructor(){}
    sayHello() {
      return 'hello'
    }
  }

class DynamicGreeter {
  constructor(name){
    this.name = name;
  }
  sayHello() {
    return 'hello '+this.name
  }
}
  module.exports = {Greeter, DynamicGreeter}