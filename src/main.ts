import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

process.env.TZ = "Asia/Jakarta";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "https://dashboard.det9234.com",
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:3030",
      "https://portal.det9234.com",
      "https://api-dev.det9234.com",
      "https://dashboard-dev.det9234.com",
      "https://portal-dev.det9234.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "apollographql-client-version",
      "apollographql-client-name",
      "apollographql-client-platform",
    ],
  });

  const port = process.env.PORT ?? 1603;
  await app.listen(port);
}
void bootstrap();
