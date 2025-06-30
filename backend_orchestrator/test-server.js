import config from "./config/config.js";

console.log("Testing configuration...");
console.log("Port:", config.port);
console.log("Mongo URI:", config.mongoUri);
console.log("CORS Origin:", config.corsOrigin);
console.log("Docker Socket:", config.dockerSocket);
console.log("Rate Limit Window:", config.rateLimitWindowMs);
console.log("Rate Limit Max:", config.rateLimitMax);

console.log("Configuration test completed successfully!"); 