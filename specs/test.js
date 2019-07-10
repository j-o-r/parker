#!/usr/bin/env node
/*
 * 'Who was first, A chicken or egg?' test
 * testing the parker-promise with a parker promise
 */
const assert = require('assert');
const now = new Date().getTime();
const Parker = require('../lib/Parker.js');
var test = new Parker();

test.do('Add multiple functions to "do"', (t) => {
  const promise = new Parker();
  let counter = 0;

  promise.do('set a timeout amd 2 incements',
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.equal(counter, 3);
      t.done();
    })
    .whenFail((e) => {
      t.fail();
    });
});
// without description
test.thenDo((t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do(
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.equal(counter, 3);
      t.done();
    })
    .whenFail((e) => {
      t.fail();
    });
});
// with timeout param
test.thenDo(1000, (t) => {
  const promise = new Parker();
  let counter = 0;

  promise.do('set a timeout amd 2 incements',
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.equal(counter, 3);
      t.done();
    })
    .whenFail((e) => {
      t.fail();
    });
});
// expect to timeout
test.thenDo('expect to timeout', (t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do('Do the timeout here', 500,
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 510);
    }
  )
    .whenDone(() => {
      t.fail();
    })
    .whenFail((e) => {
      // This will fail in a timeout
      assert.equal(counter, 2);
      t.done();
    });
});
test.thenDo('Test an "or" clause', (t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do('First try',
    (p) => {
      setTimeout(() => {
        counter++;
        p.fail(); // this blovk fails
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  ).orDo('Second try',
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    (p) => {
      counter++;
      p.done();
    },
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.equal(counter, 6);
      t.done();
    })
    .whenFail((e) => {
      t.fail();
    });
});

test.whenDone(() => {
  let duration = new Date().getTime() - now;
  console.log('ready in: '+ duration + ' ms') // eslint-disable-line
  process.exit(0);
}).whenFail((e) => {
  console.log(e) //eslint-disable-line
  process.exit(1);
});

// vim: set ts=2 sw=2 et :
