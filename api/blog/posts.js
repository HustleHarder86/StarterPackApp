import { getFirebaseAdmin } from '../../utils/firebase-admin.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await getFirebaseAdmin();

    // GET - Fetch blog posts
    if (req.method === 'GET') {
      const {
        category,
        tag,
        author,
        search,
        page = 1,
        limit = 10,
        sort = 'publishedAt',
        order = 'desc',
        status = 'published' // published, draft, all
      } = req.query;

      try {
        let query = db.collection('blogPosts');

        // Filter by status (public endpoint only shows published)
        if (!req.headers.authorization) {
          query = query.where('status', '==', 'published');
        } else if (status !== 'all') {
          query = query.where('status', '==', status);
        }

        // Filter by category
        if (category && category !== 'all') {
          query = query.where('category', '==', category);
        }

        // Filter by tag
        if (tag) {
          query = query.where('tags', 'array-contains', tag);
        }

        // Filter by author
        if (author) {
          query = query.where('author', '==', author);
        }

        // Sort
        query = query.orderBy(sort, order);

        // Pagination
        const startAt = (parseInt(page) - 1) * parseInt(limit);
        query = query.limit(parseInt(limit)).offset(startAt);

        const snapshot = await query.get();
        const posts = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            ...data,
            publishedAt: data.publishedAt?.toDate?.() || data.publishedAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
          });
        });

        // Apply search filter (client-side for now)
        let filteredPosts = posts;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredPosts = posts.filter(post => 
            post.title.toLowerCase().includes(searchLower) ||
            post.excerpt.toLowerCase().includes(searchLower) ||
            post.content?.toLowerCase().includes(searchLower)
          );
        }

        // Get total count for pagination
        const countQuery = db.collection('blogPosts')
          .where('status', '==', 'published');
        const countSnapshot = await countQuery.get();
        const totalCount = countSnapshot.size;

        return res.status(200).json({
          success: true,
          posts: filteredPosts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Failed to fetch posts' });
      }
    }

    // POST - Create new blog post (requires auth)
    if (req.method === 'POST') {
      // Check for admin auth
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      try {
        const {
          title,
          slug,
          excerpt,
          content,
          category,
          categoryName,
          tags = [],
          author,
          authorTitle,
          authorBio,
          authorAvatar,
          thumbnail,
          featured = false,
          status = 'draft',
          publishedAt,
          metaTitle,
          metaDescription,
          canonicalUrl
        } = req.body;

        // Validate required fields
        if (!title || !slug || !excerpt || !content || !category) {
          return res.status(400).json({ 
            error: 'Missing required fields: title, slug, excerpt, content, category' 
          });
        }

        // Check if slug already exists
        const existingPost = await db.collection('blogPosts')
          .where('slug', '==', slug)
          .get();

        if (!existingPost.empty) {
          return res.status(400).json({ error: 'Slug already exists' });
        }

        // Calculate read time
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200) + ' min read';

        // Create post document
        const postData = {
          title,
          slug,
          excerpt,
          content,
          category,
          categoryName,
          tags,
          author: author || 'InvestorProps Team',
          authorTitle: authorTitle || 'Real Estate Expert',
          authorBio: authorBio || 'Helping investors make smarter real estate decisions.',
          authorAvatar,
          thumbnail,
          featured,
          status,
          readTime,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 0,
          likes: 0,
          seo: {
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt,
            canonicalUrl: canonicalUrl || `https://investorprops.vercel.app/blog/${slug}`
          }
        };

        const docRef = await db.collection('blogPosts').add(postData);

        return res.status(201).json({
          success: true,
          post: {
            id: docRef.id,
            ...postData
          }
        });
      } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Failed to create post' });
      }
    }

    // PUT - Update blog post (requires auth)
    if (req.method === 'PUT') {
      // Check for admin auth
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Post ID required' });
      }

      try {
        const updates = req.body;
        
        // Update read time if content changed
        if (updates.content) {
          const wordCount = updates.content.split(/\s+/).length;
          updates.readTime = Math.ceil(wordCount / 200) + ' min read';
        }

        updates.updatedAt = new Date();

        await db.collection('blogPosts').doc(id).update(updates);

        return res.status(200).json({
          success: true,
          message: 'Post updated successfully'
        });
      } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ error: 'Failed to update post' });
      }
    }

    // DELETE - Delete blog post (requires auth)
    if (req.method === 'DELETE') {
      // Check for admin auth
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Post ID required' });
      }

      try {
        await db.collection('blogPosts').doc(id).delete();

        return res.status(200).json({
          success: true,
          message: 'Post deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Failed to delete post' });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}