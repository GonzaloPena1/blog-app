require("dotenv").config();
const Sequelize = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";

let sequelize;

if (isProduction) {
  // For production on Render
  sequelize = new Sequelize(
    process.env.DATABASE_URL || process.env.JAWSDB_URL,
    {
      dialect: process.env.JAWSDB_URL ? "mysql" : "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    }
  );
} else {
  // For local development
  sequelize = new Sequelize(
    process.env.DB_NAME || "blog_db",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      dialect: "mysql",
      port: process.env.DB_PORT || 3306,
      logging: console.log,
    }
  );
}

module.exports = sequelize;
