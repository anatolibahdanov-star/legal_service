module.exports = {
  apps: [
    {
      name: "lllms-dev.ru",
      cwd: "/var/www/lllms",
      script: process.execPath.replace(/\/node$/, "/npm"),
      args: "start",
      env: {
        NODE_EXTRA_CA_CERTS: "/var/www/lllms/certs/russian_trusted_bundle.pem",
      },
    },
  ],
};
