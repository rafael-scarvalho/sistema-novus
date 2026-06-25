module.exports = {
  apps: [
    {
      name: 'novus-api',
      cwd: './apps/api',
      script: 'npx',
      args: 'tsx src/server.ts',
      env_production: {
        NODE_ENV: 'production',
      },
      // Reinicia automaticamente se cair
      autorestart: true,
      // Reinicia se usar mais de 500MB de RAM
      max_memory_restart: '500M',
      // Guarda os logs
      out_file: '/var/log/novus/api-out.log',
      error_file: '/var/log/novus/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
