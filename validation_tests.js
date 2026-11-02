db = db.getSiblingDB("social_app");

function expectFail(label, fn) {
  try { fn(); print("UNEXPECTED SUCCESS: " + label); }
  catch (e) { print("Rejected as expected: " + label + "  [" + e.codeName + "]"); }
}

print("\n=== Bad data should be REJECTED ===");
expectFail("username too short", () =>
  db.users.insertOne({ username: "ab", joinedAt: new Date(), followersCount: 0, followingCount: 0 }));
expectFail("date stored as string", () =>
  db.users.insertOne({ username: "test_user", joinedAt: "2026-10-27", followersCount: 0, followingCount: 0 }));
expectFail("negative follower count", () =>
  db.users.insertOne({ username: "test_user", joinedAt: new Date(), followersCount: -5, followingCount: 0 }));
expectFail("post missing required fields", () =>
  db.posts.insertOne({ text: "no author" }));

print("\n=== Valid data should be ACCEPTED ===");
const r = db.users.insertOne({ username: "test_user", joinedAt: new Date(), followersCount: 0, followingCount: 0 });
print("Valid user inserted: " + r.insertedId);
db.users.deleteOne({ _id: r.insertedId });
print("Cleaned up test user");