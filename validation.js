db = db.getSiblingDB("social_app");

db.runCommand({
  collMod: "users",
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["username", "joinedAt", "followersCount", "followingCount"],
    properties: {
      username:       { bsonType: "string", minLength: 3 },
      isVerified:     { bsonType: "bool" },
      joinedAt:       { bsonType: "date" },
      followersCount: { bsonType: "number", minimum: 0 },
      followingCount: { bsonType: "number", minimum: 0 },
      interests:      { bsonType: "array", items: { bsonType: "string" } }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

db.runCommand({
  collMod: "posts",
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["authorId", "text", "hashtags", "likesCount", "createdAt"],
    properties: {
      authorId:   { bsonType: "objectId" },
      text:       { bsonType: "string", minLength: 1 },
      hashtags:   { bsonType: "array", items: { bsonType: "string" } },
      likesCount: { bsonType: "number", minimum: 0 },
      createdAt:  { bsonType: "date" }
    }
  }},
  validationLevel: "strict",
  validationAction: "error"
});

print("Validators applied to users and posts");