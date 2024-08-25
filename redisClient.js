//redisClient connection
import { createClient } from "redis";

const client = createClient({
  password: "8RmNErSuRxHtUzbIHODVZJ3uMKUgJPQp",
  socket: {
    host: "redis-16098.c322.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 16098,
  },
});

client.on("error", (err) => console.error("Redis Client Error", err));
console.log(client.isReady);
const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
  }
};

export { client, connectRedis };
