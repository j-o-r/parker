#!/usr/bin/env node
/*
 * 'Who was first, A chicken or egg?' test
 * testing the parker-promise with a parker promise
 */
import assert from 'assert';
import Parker from '../lib/Parker.js';
const now = new Date().getTime();
const test = new Parker(true);
test.do('Add multiple functions to "do"',
  /** @param {import('../lib/Parker.js').ParkerPromise} t */
  (t) => {
    const promise = new Parker();
    let counter = 0;

    promise.do('set a timeout amd 2 incements',
      /** @param {import('../lib/Parker.js').ParkerPromise} p */
      (p) => {
        setTimeout(() => {
          counter++;
          p.done();
        }, 100);
      },
      /** @param {import('../lib/Parker.js').ParkerPromise} p */
      (p) => {
        counter++;
        p.done();
      },
      /** @param {import('../lib/Parker.js').ParkerPromise} p */
      (p) => {
        setTimeout(() => {
          counter++;
          p.done();
        }, 500);
      }
    )
      .whenDone(() => {
        assert.strictEqual(counter, 3);
        t.done();
      })
      .whenFail((e) => {
        t.fail();
      });
  });
// without description
/** @param {import('../lib/Parker.js').ParkerPromise} t */
test.thenDo((t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do(
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      counter++;
      p.done();
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.strictEqual(counter, 3);
      t.done();
    })
    .whenFail(() => {
      t.fail();
    });
});
// with timeout param
/** @param {import('../lib/Parker.js').ParkerPromise} t */
test.thenDo(1000, (t) => {
  const promise = new Parker();
  let counter = 0;

  promise.do('set a timeout amd 2 incements',
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      counter++;
      p.done();
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.strictEqual(counter, 3);
      t.done();
    })
    .whenFail((e) => {
      console.log(e);
      t.fail();
    });
});
// expect to timeout
/** @param {import('../lib/Parker.js').ParkerPromise} t */
test.thenDo('expect to timeout', (t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do('Do the timeout here', 500,
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      counter++;
      p.done();
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
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
      console.log(e);
      assert.strictEqual(counter, 2);
      t.done();
    });
});
/** @param {import('../lib/Parker.js').ParkerPromise} t */
test.thenDo('Test an "or" clause', (t) => {
  const promise = new Parker();
  let counter = 0;
  promise.do('First try',
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.fail(); // this blovk fails
      }, 100);
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      counter++;
      p.done();
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  ).orDo('Second try',
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 100);
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      counter++;
      p.done();
    },
    /** @param {import('../lib/Parker.js').ParkerPromise} p */
    (p) => {
      setTimeout(() => {
        counter++;
        p.done();
      }, 500);
    }
  )
    .whenDone(() => {
      assert.strictEqual(counter, 6);
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
