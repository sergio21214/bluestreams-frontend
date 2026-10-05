module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "D:/BlueStreams/bluestreams-frontend",
      script: "D:/Program Files/nodejs/node.exe",
      args: "node_modules/next/dist/bin/next start",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};