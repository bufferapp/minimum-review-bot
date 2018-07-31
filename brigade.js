const brigade = require('brigadier')
const brigadeScripts = require('@bufferapp/buffer-service-brigade-scripts')

// https://github.com/bufferapp/buffer-service-brigade-scripts#example-configuration

brigadeScripts({
  brigade,
  envVars: [
    // use this when we update to helm 2.9.0+
    // {
    //   name: 'APP_ID',
    //   projectSecret: 'APP_ID',
    // },
    {
      name: 'WEBHOOK_SECRET',
      projectSecret: 'WEBHOOK_SECRET',
    },
    {
      name: 'PRIVATE_KEY',
      projectSecret: 'PRIVATE_KEY',
    },
  ],
  devDeploys: [
    {
      branch: /.*/,
      namespace: 'dev',
    },
  ],
})
