import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Academic Performance Management API",
      version: "0.1.0",
      description: "Swagger documentation for backend Phase 3 APIs.",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Local API server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
});

