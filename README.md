## parker-promise

### Install:

```
    npm install parker-promise --save
```

### Test:
```
git clone https://github.com/j-o-r/parker.git
cd parker
npm install
npm run test
```

### Usage:

    import Parker from 'parker-promise';
    var promise = new Parker();
    promise.do('set a timeOut and 2 increments',
      // Can we pass something
      // extra to 'this' promise
      function(promise){
        callback_counter ++;

        setTimeout(function(){
          // promise.done();
          setTimeout(function(){

            promise.done();

          },100);
        },100);

      },

      function(promise){
        callback_counter ++;
        promise.done();
      },

      function(promise){
        callback_counter ++;
        promise.done();
      }

    ).whenDone( function(){
      success_called = true;
    }).whenFail( function(){
      error_called = true;
    });

or:

    promise.do(
      function(promise){
        callback_counter ++;
        promise.done();
      },
      function(promise){
        callback_counter ++;
        // This block is causing an error
        // So the next block will be valid
        promise.fail();
      },
      function(promise){
        callback_counter ++;
        promise.done();
      }
    ).orDo(
      function(promise){
        callback_counter ++;
        promise.done();
      },
      function(promise){
        callback_counter ++;
        promise.done();
      },
      function(promise){
        callback_counter ++;
        promise.done();
      }
    ).whenDone( function(){
      success_called = true;
    }).whenFail( function(){
      error_called = true;
    });

or:

    promise.do(

      function(promise){
        promise.done();
      }

    ).thenDo(

      function(promise){
        // console.log('Then called');
        setTimeout(function(){
            // console.log('READY');
            // self.pOptions.current_level == 2 at this position
            // console.log(u.inspect(promise),true);
          promise.done();
        },100);
      }

    ).orDo(

      function(promise){
        // console.log('Or called');
         // console.log('ERROR');
         // console.log(u.inspect(promise),true);
        promise.fail();
      }

    ).whenDone( function(){
      success_called = true;
    }).whenFail( function(){
      error_called = true;
    });


