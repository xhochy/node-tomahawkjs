node-tomahawkjs
==========================

Implementation of the JS plugins API from Tomahawk for NodeJS

(This implementation is not fully feature complete compared to the desktop client but [hubot-tomahk](https://github.com/xhochy/hubot-tomahk) is an exmple usage of parts of it)

Usage
-----

### Create a resolver instance

To load a single resolver, we simply use the following code if we know the path to the .axe file:

```javascript
var TomahawkJS = require('tomahawkjs');

TomahawkJS.loadAxe(pathtoaxe, function(err, axe) {
  // TODO: Check for error in err
  // After load the axe, we most likely want to have an instance of the resolver
  axe.getInstace(function(err, instance_context) {
    // TODO: Check for error in err
    var instance = instance_context.instance;
    // Each Resolver instance runs in its own global JavaScript context
    var context = instance_context.context;
    // Start the instance
    // Due to the architecture of the resolveres, this may do some background work and will not block.
    instance.init();
    // We can now use the instance
  });
});
```
