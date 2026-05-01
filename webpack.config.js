const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  plugins: [
    new TsconfigPathsPlugin({
      configFile: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@auth/application': path.resolve(__dirname, 'src/modules/auth/application'),
      '@auth/domain': path.resolve(__dirname, 'src/modules/auth/domain'),
      '@auth/infrastructure': path.resolve(__dirname, 'src/modules/auth/infrastructure'),
      '@user/application': path.resolve(__dirname, 'src/modules/user/application'),
      '@user/domain': path.resolve(__dirname, 'src/modules/user/domain'),
      '@user/infrastructure': path.resolve(__dirname, 'src/modules/user/infrastructure'),
      '@clinical/application': path.resolve(__dirname, 'src/modules/clinical/application'),
      '@clinical/domain': path.resolve(__dirname, 'src/modules/clinical/domain'),
      '@clinical/infrastructure': path.resolve(__dirname, 'src/modules/clinical/infrastructure'),
      '@clinical/entities': path.resolve(__dirname, 'src/modules/clinical/domain/entities'),
      '@telemetry/application': path.resolve(__dirname, 'src/modules/telemetry/application'),
      '@telemetry/domain': path.resolve(__dirname, 'src/modules/telemetry/domain'),
      '@telemetry/infrastructure': path.resolve(__dirname, 'src/modules/telemetry/infrastructure'),
      '@sync/application': path.resolve(__dirname, 'src/modules/sync/application'),
      '@sync/domain': path.resolve(__dirname, 'src/modules/sync/domain'),
      '@sync/infrastructure': path.resolve(__dirname, 'src/modules/sync/infrastructure'),
      '@services/application': path.resolve(__dirname, 'src/modules/services/application'),
      '@services/domain': path.resolve(__dirname, 'src/modules/services/domain'),
      '@services/infrastructure': path.resolve(__dirname, 'src/modules/services/infrastructure'),
    },
  },
};
