// Initialize MongoDB replica set for high availability
rs.initiate({
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "localhost:27017",
      priority: 1
    }
  ]
});

// Wait for replica set to be ready
while (rs.status().ok !== 1) {
  print("Waiting for replica set to be ready...");
  sleep(1000);
}

print("Replica set initialized successfully!");

// Create application database and user
db = db.getSiblingDB('containersDB');

// Create application user with appropriate permissions
db.createUser({
  user: "orchestrator",
  pwd: "orchestrator_password",
  roles: [
    {
      role: "readWrite",
      db: "containersDB"
    }
  ]
});

print("Application user created successfully!"); 