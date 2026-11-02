db = db.getSiblingDB("social_app");
const show = (title, cursor) => { print("\n=== " + title + " ==="); printjson(cursor.toArray()); };

// 1. Trending hashtags (public posts only)
show("1. Trending hashtags", db.posts.aggregate([
  { $match: { isPublic: true } },
  { $unwind: "$hashtags" },
  { $group: { _id: "$hashtags", posts: { $sum: 1 }, totalLikes: { $sum: "$likesCount" } } },
  { $sort: { posts: -1, totalLikes: -1, _id: 1 } },
  { $limit: 5 }
]));

// 2. Top users by likes received
show("2. Top users by total likes received", db.posts.aggregate([
  { $group: { _id: "$authorUsername", posts: { $sum: 1 }, totalLikes: { $sum: "$likesCount" } } },
  { $sort: { totalLikes: -1, _id: 1 } },
  { $limit: 5 }
]));

// 3. Engagement per day
show("3. Daily engagement", db.posts.aggregate([
  { $match: { isPublic: true } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      posts: { $sum: 1 },
      likes: { $sum: "$likesCount" },
      comments: { $sum: "$commentsCount" } } },
  { $addFields: { engagement: { $add: ["$likes", "$comments"] } } },
  { $sort: { _id: 1 } }
]));

// 4. Overall post statistics
show("4. Post statistics", db.posts.aggregate([
  { $match: { isPublic: true } },
  { $group: { _id: null, totalPosts: { $sum: 1 }, totalLikes: { $sum: "$likesCount" },
              avgLikes: { $avg: "$likesCount" }, maxLikes: { $max: "$likesCount" }, minLikes: { $min: "$likesCount" } } }
]));

// 5. Most engaging posts (comments weigh double)
show("5. Most engaging posts", db.posts.aggregate([
  { $match: { isPublic: true } },
  { $addFields: { engagementScore: { $add: ["$likesCount", { $multiply: ["$commentsCount", 2] }] } } },
  { $sort: { engagementScore: -1 } },
  { $limit: 3 },
  { $project: { _id: 0, text: 1, likesCount: 1, commentsCount: 1, engagementScore: 1 } }
]));

// 6. Popular interests
show("6. Popular interests", db.users.aggregate([
  { $unwind: "$interests" },
  { $group: { _id: "$interests", users: { $sum: 1 }, who: { $push: "$username" } } },
  { $sort: { users: -1, _id: 1 } }
]));

// 7. $lookup: a post with its comments (replaces the two-step query from Phase 3)
show("7. Post with its comments ($lookup)", db.posts.aggregate([
  { $match: { text: "Sunset at India Gate" } },
  { $lookup: { from: "comments", localField: "_id", foreignField: "postId", as: "comments" } },
  { $project: { _id: 0, text: 1, likesCount: 1, "comments.username": 1, "comments.text": 1 } }
]));

// 8. $lookup twice: followers of neha_g in a single query
show("8. Followers of neha_g", db.users.aggregate([
  { $match: { username: "neha_g" } },
  { $lookup: { from: "follows", localField: "_id", foreignField: "followeeId", as: "f" } },
  { $lookup: { from: "users", localField: "f.followerId", foreignField: "_id", as: "followers" } },
  { $project: { _id: 0, username: 1, followersCount: 1, followers: "$followers.username" } }
]));

// 9. Top commenters
show("9. Top commenters", db.comments.aggregate([
  { $group: { _id: "$username", comments: { $sum: 1 } } },
  { $sort: { comments: -1, _id: 1 } }
]));

// 10. Activity per user (join activity_logs with users)
show("10. Activity per user", db.activity_logs.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $unwind: "$user" },
  { $group: { _id: "$user.username", actions: { $sum: 1 }, types: { $addToSet: "$type" } } },
  { $sort: { actions: -1 } }
]));

// 11. $bucket: users grouped by follower ranges
show("11. Follower ranges ($bucket)", db.users.aggregate([
  { $bucket: { groupBy: "$followersCount", boundaries: [0, 1, 3, 10],
               output: { users: { $sum: 1 }, names: { $push: "$username" } } } }
]));

// 12. $facet: several results from one query (dashboard)
show("12. Dashboard ($facet)", db.posts.aggregate([
  { $match: { isPublic: true } },
  { $facet: {
      topPosts:   [ { $sort: { likesCount: -1 } }, { $limit: 2 }, { $project: { _id: 0, text: 1, likesCount: 1 } } ],
      totals:     [ { $group: { _id: null, posts: { $sum: 1 }, likes: { $sum: "$likesCount" } } } ],
      byAuthor:   [ { $group: { _id: "$authorUsername", posts: { $sum: 1 } } }, { $sort: { _id: 1 } } ]
  } }
]));

// 13. $setWindowFields: rank users by followers
show("13. Follower ranking ($setWindowFields)", db.users.aggregate([
  { $setWindowFields: { sortBy: { followersCount: -1 }, output: { rank: { $rank: {} } } } },
  { $project: { _id: 0, username: 1, followersCount: 1, rank: 1 } }
]));