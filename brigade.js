const brigade = require('brigadier')
const brigadeScripts = require('@bufferapp/buffer-service-brigade-scripts')

// https://github.com/bufferapp/buffer-service-brigade-scripts#example-configuration

brigadeScripts({
  brigade,
  envVars: [
    {
      name: 'WEBHOOK_SECRET',
      projectSecret: 'WEBHOOK_SECRET',
    },
  ],
  devDeploys: [
    {
      branch: /.*/,
      namespace: 'dev',
    },
  ],
})
