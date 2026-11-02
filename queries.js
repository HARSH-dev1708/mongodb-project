db = db.getSiblingDB("social_app");

print("\n=== Q1: Comments of 'Sunset at India Gate', newest first ===");
const post = db.posts.findOne({ text: "Sunset at India Gate" });
printjson(db.comments.find({ postId: post._id }, { username: 1, text: 1, createdAt: 1, _id: 0 })
  .sort({ createdAt: -1 }).toArray());

print("\n=== Q2: Who follows riya_s? ===");
const riya = db.users.findOne({ username: "riya_s" });
const ids = db.follows.find({ followeeId: riya._id }).toArray().map(f => f.followerId);
printjson(db.users.find({ _id: { $in: ids } }, { username: 1, _id: 0 }).toArray());

print("\n=== Q3: Has sam_t liked 'Sunset at India Gate'? ===");
const sam = db.users.findOne({ username: "sam_t" });
const liked = db.likes.findOne({ userId: sam._id, postId: post._id });
print(liked ? "YES, liked" : "NO, not liked");

print("\n=== Q4: Duplicate like is blocked by the unique index ===");
try {
  db.likes.insertOne({ userId: sam._id, postId: post._id, createdAt: new Date() });
  print("UNEXPECTED: duplicate was allowed");
} catch (e) {
  print("Rejected as expected: " + e.codeName);
}