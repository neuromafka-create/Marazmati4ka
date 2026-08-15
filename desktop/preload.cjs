const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("marazmati4ka", {
  desktop: true,
});
