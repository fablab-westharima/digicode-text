// Web Serial mock. Installed before the page loads, so no real port, device or USB bus is ever
// touched by these tests. It behaves like Chrome's implementation in the two ways that matter:
//   * requestPort() hands back the same SerialPort object for the same device, so a port that was
//     left open is offered again — open() on it then fails with the very InvalidStateError the
//     user saw ("The port is already open.").
//   * close() is refused while port.readable is still locked by a reader.
// window.__serial records every call in order, so a test can check the teardown sequence.
export async function installSerialMock(page) {
  page.on('dialog', dialog => dialog.accept()); // 「USBポートを解除」の confirm
  await page.addInitScript(() => {
    const mock = { requests: 0, calls: [], options: null, filters: null, cancelRequest: false, hold: false, failOpen: null, failClose: false, failReader: false, failSignals: false, signals: [], vendorId: 0x303a };
    window.__serial = mock;
    const fail = (name, message) => Object.assign(new Error(message), { name });

    function makePort(name) {
      const port = {
        name, opened: false, forgotten: false, locked: false, queue: [], done: false, waiting: null,
        async open(options) {
          mock.calls.push(`${name}.open`);
          mock.options = options;
          if (port.opened) throw fail('InvalidStateError', "Failed to execute 'open' on 'SerialPort': The port is already open.");
          if (mock.failOpen) { const message = mock.failOpen; mock.failOpen = null; throw fail('NetworkError', message); }
          port.opened = true; port.done = false; port.queue = [];
          port.readable = {
            get locked() { return port.locked; },
            getReader() {
              if (mock.failReader) { mock.failReader = false; throw fail('TypeError', 'the readable is gone'); }
              if (port.locked) throw fail('TypeError', 'the stream is already locked');
              port.locked = true;
              return {
                read: () => new Promise(resolve => {
                  if (port.queue.length) resolve({ value: port.queue.shift(), done: false });
                  else if (port.done) resolve({ value: undefined, done: true });
                  else port.waiting = resolve;
                }),
                cancel: async () => {
                  mock.calls.push(`${name}.cancel`);
                  port.done = true;
                  const waiting = port.waiting; port.waiting = null;
                  waiting?.({ value: undefined, done: true });
                },
                releaseLock: () => { mock.calls.push(`${name}.releaseLock`); port.locked = false; },
              };
            },
          };
        },
        async close() {
          mock.calls.push(`${name}.close`);
          if (mock.failClose) throw fail('InvalidStateError', 'the port refused to close');
          if (port.locked) throw fail('InvalidStateError', 'the stream is still locked'); // Chrome の挙動
          if (!port.opened) throw fail('InvalidStateError', 'the port is already closed');
          port.opened = false;
        },
        getInfo: () => ({ usbVendorId: mock.vendorId, usbProductId: 1 }),
        async setSignals(signals) {
          mock.signals.push(signals);
          if (mock.failSignals) { mock.failSignals = false; throw fail('NetworkError', 'Failed to set control signals.'); }
        },
        async forget() { mock.calls.push(`${name}.forget`); port.forgotten = true; port.opened = false; },
      };
      return port;
    }

    mock.port = makePort('p1');
    mock.send = (text) => {
      const port = mock.port;
      const value = new TextEncoder().encode(text);
      const waiting = port.waiting; port.waiting = null;
      if (waiting) waiting({ value, done: false }); else port.queue.push(value);
    };
    mock.state = () => ({ opened: mock.port.opened, locked: mock.port.locked, forgotten: mock.port.forgotten });

    Object.defineProperty(navigator, 'serial', {
      configurable: true,
      value: {
        requestPort(options) {
          mock.requests++;
          mock.filters = options?.filters ?? null;
          if (mock.cancelRequest) return Promise.reject(fail('NotFoundError', 'No port selected by the user.'));
          if (mock.hold) return new Promise(resolve => { mock.release = () => resolve(mock.port); });
          return Promise.resolve(mock.port);
        },
        getPorts: async () => (mock.port.forgotten ? [] : [mock.port]),
      },
    });
  });
}

export const serial = page => page.evaluate(() => ({ ...window.__serial.state(), calls: window.__serial.calls, signals: window.__serial.signals, requests: window.__serial.requests }));
export const send = (page, text) => page.evaluate(text => window.__serial.send(text), text);
