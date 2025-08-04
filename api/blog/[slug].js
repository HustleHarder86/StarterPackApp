import { getFirebaseAdmin } from '../../utils/firebase-admin.js';

import { applyCorsHeaders } from '../../utils/cors-config.js';
import { apiLimits } from '../../utils/rate-limiter.js';
export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.read(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug parameter is required' });
  }

  try {
    const { db } = await getFirebaseAdmin();

    // Find post by slug
    const postsSnapshot = await db.collection('blogPosts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (postsSnapshot.empty) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postDoc = postsSnapshot.docs[0];
    const postData = postDoc.data();

    // Increment view count
    await postDoc.ref.update({
      views: (postData.views || 0) + 1
    });

    // Get related posts (same category, excluding current post)
    const relatedSnapshot = await db.collection('blogPosts')
      .where('category', '==', postData.category)
      .where('status', '==', 'published')
      .where('slug', '!=', slug)
      .orderBy('publishedAt', 'desc')
      .limit(3)
      .get();

    const relatedPosts = [];
    relatedSnapshot.forEach(doc => {
      const data = doc.data();
      relatedPosts.push({
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        thumbnail: data.thumbnail,
        readTime: data.readTime,
        publishedAt: data.publishedAt?.toDate?.() || data.publishedAt
      });
    });

    // Get more posts from the same category
    const categorySnapshot = await db.collection('blogPosts')
      .where('category', '==', postData.category)
      .where('status', '==', 'published')
      .where('slug', '!=', slug)
      .orderBy('publishedAt', 'desc')
      .limit(6)
      .get();

    const categoryPosts = [];
    categorySnapshot.forEach(doc => {
      const data = doc.data();
      categoryPosts.push({
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        thumbnail: data.thumbnail,
        readTime: data.readTime,
        category: data.category,
        categoryName: data.categoryName,
        publishedAt: data.publishedAt?.toDate?.() || data.publishedAt
      });
    });

    // Format the main post data
    const post = {
      id: postDoc.id,
      ...postData,
      publishedAt: postData.publishedAt?.toDate?.() || postData.publishedAt,
      updatedAt: postData.updatedAt?.toDate?.() || postData.updatedAt,
      relatedPosts,
      categoryPosts
    };

    return res.status(200).json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
}