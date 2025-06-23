import { WebSocket } from "ws";

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.shuffle = function () {
  for (let i = this.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this[i], this[j]] = [this[j], this[i]];
  }
  return this;
};

WebSocket.prototype.init = function () {
  this.channels = new Map();
  this.on("message", (message) => {
    try {
      const { channel, data } = JSON.parse(message.toString());
      this.propagate(channel, data);
    } catch (e) {
      console.error(e);
    }
  });
};

WebSocket.prototype.register = function (channel, callback) {
  this.channels.set(channel, callback);
};

WebSocket.prototype.propagate = function (channel, data) {
  const callback = this.channels.get(channel);
  if (callback) {
    callback(data);
  } else if (this.peer) {
    // redirect message to peer
    return this.peer.send(JSON.stringify({ channel, data }));
  }
}; 