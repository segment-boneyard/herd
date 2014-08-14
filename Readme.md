# herd

  Herd your child processes! A simple wrapper over node cluster for zero-downtime reloads.

## Quickstart

Just pass herd the function to run on the child-processes.

```javascript
var http = require('http');
var herd = require('herd');

herd('server')
  .run(function (){
    http.createServer.listen(8000);
  });
```

From the terminal, send a `SIGHUP` signal to gracefully reload the process:

```shell
$ kill -1 1922
```

We usually keep the master process really small, and never restart it. By default the process will exit after 1 second, but close handlers and custom timeouts can be specified as well.

## API

#### Herd(name)

Create a new herd with title `name`

#### .timeout(ms)

Set the timeout before killing a worker in ms. (defaults to 1 second if you don't specify a close handler, otherwise none).

#### .server(isServer)

By default, new processes will not be created until a `listening` event is emitted by the child process (which is the default for _servers_). Call this flag if you'd rather wait for `online` event, in the case of your workers which might not ever call `net.Server.listen`.

#### .size(workers)

Set the number of workers to spawn. Defaults to the number of cpus.

#### .close(fn)

Calls the `fn` as the worker is as part of the exit handler. Which can be used to perform some type of cleanup before exiting. If a timeout is also specified, the process will exit whenever the first condition is triggered.

```js

/**
 * Flush our remaining messages to disk.
 */

function close(fn){
  flush(msgs, fn);
}


herd()
  .close(close)
  .run(run);
```

## License

(The MIT License)

Copyright (c) 2012 Segment.io &lt;friends@segment.io&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
