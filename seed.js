db = db.getSiblingDB("social_app");
["users", "posts", "comments", "likes", "follows", "activity_logs"].forEach(c => db[c].drop());

// ---------- users ----------
const u = {};
[
  { username: "riya_s",  city: "Delhi",     interests: ["travel", "food"],          isVerified: false, joinedAt: new Date("2025-03-14") },
  { username: "arjun_k", city: "Mumbai",    interests: ["cricket", "music"],        isVerified: false, joinedAt: new Date("2025-06-02") },
  { username: "meera_p", city: "Pune",      interests: ["photography", "travel"],   isVerified: false, joinedAt: new Date("2025-08-19") },
  { username: "dev_r",   city: "Bangalore", interests: ["coding"],                  isVerified: false, joinedAt: new Date("2026-01-10") },
  { username: "sam_t",   city: "Delhi",     interests: ["music", "food", "cricket"],isVerified: false, joinedAt: new Date("2026-02-21") },
  { username: "neha_g",  city: "Delhi",     interests: ["fashion", "travel"],       isVerified: true,  joinedAt: new Date("2024-11-05") }
].forEach(doc => {
  doc.followersCount = 0;
  doc.followingCount = 0;
  u[doc.username] = db.users.insertOne(doc).insertedId;
});

// ---------- helpers ----------
const p = {};
function addPost(key, author, text, hashtags, createdAt, isPublic = true) {
  p[key] = db.posts.insertOne({
    authorId: u[author], authorUsername: author, text, hashtags, isPublic,
    likesCount: 0, commentsCount: 0, createdAt: new Date(createdAt)
  }).insertedId;
}
function follow(a, b) {
  db.follows.insertOne({ followerId: u[a], followeeId: u[b], createdAt: new Date() });
  db.users.updateOne({ _id: u[a] }, { $inc: { followingCount: 1 } });
  db.users.updateOne({ _id: u[b] }, { $inc: { followersCount: 1 } });
}
function like(user, post) {
    
  db.likes.insertOne({ userId: u[user], postId: p[post], createdAt: new Date() });
  db.posts.updateOne({ _id: p[post] }, { $inc: { likesCount: 1 } });
}
function comment(user, post, text) {
  db.comments.insertOne({ postId: p[post], userId: u[user], username: user, text, likesCount: 0, createdAt: new Date() });
  db.posts.updateOne({ _id: p[post] }, { $inc: { commentsCount: 1 } });
}

// ---------- posts ----------
addPost("sunset",   "riya_s",  "Sunset at India Gate",      ["delhi", "sunset", "travel"], "2026-10-20T18:30:00Z");
addPost("match",    "arjun_k", "Match day vibes",           ["cricket", "india"],          "2026-10-21T09:00:00Z");
addPost("portrait", "meera_p", "Golden hour portrait",      ["photography", "sunset"],     "2026-10-22T17:45:00Z");
addPost("mongo",    "dev_r",   "Learning MongoDB!",         ["coding", "mongodb"],         "2026-10-23T12:00:00Z");
addPost("winter",   "neha_g",  "Winter collection drop",    ["fashion", "winter"],         "2026-10-24T10:15:00Z");
addPost("food",     "sam_t",   "Best street food in Delhi", ["food", "delhi"],             "2026-10-25T20:00:00Z");
addPost("diary",    "riya_s",  "Private travel diary",      ["travel"],                    "2026-10-26T08:00:00Z", false);

// ---------- follows ----------
[["arjun_k","riya_s"],["sam_t","riya_s"],["meera_p","riya_s"],
 ["riya_s","neha_g"],["meera_p","neha_g"],["sam_t","neha_g"],["arjun_k","neha_g"],["dev_r","neha_g"],
 ["dev_r","meera_p"],["riya_s","meera_p"]].forEach(([a, b]) => follow(a, b));

// ---------- likes ----------
[["arjun_k","sunset"],["sam_t","sunset"],["meera_p","sunset"],
 ["riya_s","portrait"],["neha_g","portrait"],["sam_t","portrait"],["dev_r","portrait"],
 ["riya_s","winter"],["meera_p","winter"],["arjun_k","winter"],["sam_t","winter"],["dev_r","winter"],
 ["riya_s","food"],["arjun_k","match"],["neha_g","mongo"]].forEach(([user, post]) => like(user, post));

// ---------- comments ----------
comment("arjun_k", "sunset",   "Beautiful!");
comment("sam_t",   "sunset",   "Love this");
comment("riya_s",  "portrait", "Stunning shot");
comment("riya_s",  "winter",   "Need this");
comment("meera_p", "winter",   "Gorgeous");
comment("neha_g",  "mongo",    "Good luck!");

// ---------- activity logs ----------
db.activity_logs.insertMany([
  { userId: u["riya_s"],  type: "login",     timestamp: new Date("2026-10-26T07:55:00Z"), meta: { device: "mobile" } },
  { userId: u["riya_s"],  type: "view_post", postId: p["winter"], timestamp: new Date("2026-10-26T08:02:00Z"), meta: {} },
  { userId: u["arjun_k"], type: "login",     timestamp: new Date("2026-10-26T09:10:00Z"), meta: { device: "web" } }
]);

// ---------- constraints ----------
db.likes.createIndex({ postId: 1, userId: 1 }, { unique: true });
db.follows.createIndex({ followerId: 1, followeeId: 1 }, { unique: true });
db.comments.createIndex({ postId: 1, createdAt: -1 });

print("Seed complete");

