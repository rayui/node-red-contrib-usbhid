module.exports = function (RED) {
  var HID = require("node-hid");

  function HIDConfigNode(n) {
    RED.nodes.createNode(this, n);
    this.vid = n.vid;
    this.pid = n.pid;
    this.path = n.path;
  }

  function usbHIDNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.connection);

    try {
      var hexvid = parseInt(this.server.vid, 10);
      var hexpid = parseInt(this.server.pid, 10);

      var device = this.server.path
        ? new HID.HID(this.server.path)
        : new HID.HID(hexvid, hexpid);

      this.status({
        fill: "green",
        shape: "dot",
        text: "connected",
      });
    } catch (err) {
      this.status({
        fill: "red",
        shape: "ring",
        text: "disconnected",
      });
    }

    var node = this;

    device.on("data", function (data) {
      var message = {
        payload: "",
      };
      message.payload = data;
      node.send([message, null]);
    });

    device.on("error", function (err) {
      var message = {
        payload: "",
      };
      message.payload = err;
      node.send([null, message]);
    });

    this.on("input", function (msg) {
      var data = toArray(msg.payload);

      device.write(data);
    });

    this.on("close", function () {
      device.close();
    });
  }

  function toArray(buffer) {
    var view = [];
    for (var i = 0; i < buffer.length; ++i) {
      view.push(buffer[i]);
    }
    return view;
  }

  function getHIDNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    this.on("input", function (msg) {
      var devices = HID.devices();
      msg.payload = devices;
      node.send(msg);
    });
  }

  RED.nodes.registerType("getHIDdevices", getHIDNode);
  RED.nodes.registerType("HIDdevice", usbHIDNode);
  RED.nodes.registerType("HIDConfig", HIDConfigNode);
};
