module.exports = {
  components: {
    securitySchemes: {
      jwtHeaderAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication by header (used in mobile apps)',
      },

      jwtCookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT cookie authentication (used in web apps)',
      },
    },
  },
};
