const pool = require("../config/db");

// Get all topics with ayah and hadith counts
const getAllTopics = async (req, res) => {
  try {
    const userId = req.user?.id;

    const query = `
      SELECT
        t.*,
        COUNT(DISTINCT ta.id) as ayah_count,
        COUNT(DISTINCT th.id) as hadith_count,
        CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as is_bookmarked,
        COALESCE(utp.progress_percentage, 0) as progress_percentage
      FROM topics t
      LEFT JOIN topic_ayahs ta ON t.id = ta.topic_id
      LEFT JOIN topic_hadith th ON t.id = th.topic_id
      LEFT JOIN user_bookmarks ub ON t.id = ub.topic_id AND ub.user_id = $1
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = $1
      WHERE t.is_active = true
      GROUP BY t.id, ub.id, utp.progress_percentage
      ORDER BY t.display_order, t.created_at DESC
    `;

    const result = await pool.query(query, [userId || null]);

    res.json({
      success: true,
      total: result.rows.length,
      topics: result.rows,
    });
  } catch (err) {
    console.error("Get topics error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get single topic with ayahs and hadith - WITH ARABIC TEXT
const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const { translator } = req.query; // Get translator from query params

    const topicResult = await pool.query("SELECT * FROM topics WHERE id = $1", [
      id,
    ]);
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Use provided translator or default to 'Ahmed Ali'
    const selectedTranslator = translator || 'Ahmed Ali';

    // Get ayahs with Arabic text and English translation from quran_text and translations
    const ayahsResult = await pool.query(
      `SELECT
        ta.id,
        ta.topic_id,
        ta.sura as surah_number,
        ta.aya as ayah_number,
        ta.display_order,
        qt.text as ayah_arabic,
        qtr.text as translation,
        s.surah_name_english as surah_name
       FROM topic_ayahs ta
       LEFT JOIN quran_text qt ON ta.sura = qt.sura AND ta.aya = qt.aya
       LEFT JOIN quran_translation qtr ON ta.sura = qtr.sura AND ta.aya = qtr.aya AND qtr.translator = $2
       LEFT JOIN surahs s ON ta.sura = s.surah_number
       WHERE ta.topic_id = $1
       ORDER BY ta.display_order, ta.id`,
      [id, selectedTranslator],
    );

    const hadithResult = await pool.query(
      `SELECT
        id,
        topic_id,
        hadith_text as hadith_english,
        hadith_arabic,
        source,
        narrator as reference,
        authenticity,
        display_order,
        CASE
          WHEN authenticity = 'Sahih' THEN 'This is an authentic hadith.'
          WHEN authenticity = 'Hasan' THEN 'This is a good hadith.'
          ELSE NULL
        END as notes
       FROM topic_hadith
       WHERE topic_id = $1
       ORDER BY display_order, id`,
      [id],
    );

    res.json({
      success: true,
      topic: topicResult.rows[0],
      ayahs: ayahsResult.rows,
      hadith: hadithResult.rows,
    });
  } catch (err) {
    console.error("Get topic error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Create topic WITH ayahs and hadith
const createTopic = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      title,
      description,
      category,
      icon,
      color,
      display_order,
      ayahs,
      hadith,
    } = req.body;
    const userId = req.user.id;

    console.log("📝 Creating topic:", {
      title,
      ayahsCount: ayahs?.length,
      hadithCount: hadith?.length,
    });

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const topicResult = await client.query(
      `INSERT INTO topics (title, description, category, icon, color, display_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description,
        category,
        icon || "📖",
        color || "#10B981",
        display_order || 0,
        userId,
      ],
    );

    const topicId = topicResult.rows[0].id;
    console.log("✅ Topic created with ID:", topicId);

    if (ayahs && Array.isArray(ayahs) && ayahs.length > 0) {
      for (let i = 0; i < ayahs.length; i++) {
        const ayah = ayahs[i];
        await client.query(
          `INSERT INTO topic_ayahs (topic_id, sura, aya, display_order, added_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [topicId, ayah.sura, ayah.aya, i, userId],
        );
      }
      console.log(`✅ ${ayahs.length} ayahs added`);
    }

    if (hadith && Array.isArray(hadith) && hadith.length > 0) {
      for (let i = 0; i < hadith.length; i++) {
        const h = hadith[i];
        await client.query(
          `INSERT INTO topic_hadith (topic_id, hadith_text, source, narrator, authenticity, display_order, added_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            topicId,
            h.hadith_text,
            h.source,
            h.narrator,
            h.authenticity || "Sahih",
            i,
            userId,
          ],
        );
      }
      console.log(`✅ ${hadith.length} hadith added`);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Topic created successfully",
      topic: topicResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Create topic error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
};

// Update topic WITH ayahs and hadith
const updateTopic = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      title,
      description,
      category,
      icon,
      color,
      display_order,
      is_active,
      ayahs,
      hadith,
    } = req.body;
    const userId = req.user.id;

    console.log("📝 Updating topic:", {
      id,
      title,
      ayahsCount: ayahs?.length,
      hadithCount: hadith?.length,
    });

    const topicResult = await client.query(
      `UPDATE topics
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           icon = COALESCE($4, icon),
           color = COALESCE($5, color),
           display_order = COALESCE($6, display_order),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, category, icon, color, display_order, is_active, id],
    );

    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    await client.query("DELETE FROM topic_ayahs WHERE topic_id = $1", [id]);
    await client.query("DELETE FROM topic_hadith WHERE topic_id = $1", [id]);

    if (ayahs && Array.isArray(ayahs) && ayahs.length > 0) {
      for (let i = 0; i < ayahs.length; i++) {
        const ayah = ayahs[i];
        await client.query(
          `INSERT INTO topic_ayahs (topic_id, sura, aya, display_order, added_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, ayah.sura, ayah.aya, i, userId],
        );
      }
      console.log(`✅ ${ayahs.length} ayahs updated`);
    }

    if (hadith && Array.isArray(hadith) && hadith.length > 0) {
      for (let i = 0; i < hadith.length; i++) {
        const h = hadith[i];
        await client.query(
          `INSERT INTO topic_hadith (topic_id, hadith_text, source, narrator, authenticity, display_order, added_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            h.hadith_text,
            h.source,
            h.narrator,
            h.authenticity || "Sahih",
            i,
            userId,
          ],
        );
      }
      console.log(`✅ ${hadith.length} hadith updated`);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Topic updated successfully",
      topic: topicResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Update topic error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
};

// Delete topic
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM topics WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json({ success: true, message: "Topic deleted successfully" });
  } catch (err) {
    console.error("Delete topic error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT category FROM topics WHERE is_active = true ORDER BY category",
    );
    res.json({ success: true, categories: result.rows.map((r) => r.category) });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getPopularTopics = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, COUNT(DISTINCT ta.id) as ayah_count, COUNT(DISTINCT th.id) as hadith_count
       FROM topics t
       LEFT JOIN topic_ayahs ta ON t.id = ta.topic_id
       LEFT JOIN topic_hadith th ON t.id = th.topic_id
       WHERE t.is_active = true
       GROUP BY t.id
       ORDER BY t.view_count DESC, t.completion_count DESC
       LIMIT 10`,
    );
    res.json({ success: true, topics: result.rows });
  } catch (err) {
    console.error("Get popular topics error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const bookmarkTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      "SELECT * FROM user_bookmarks WHERE user_id = $1 AND topic_id = $2",
      [userId, id],
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM user_bookmarks WHERE user_id = $1 AND topic_id = $2",
        [userId, id],
      );
      res.json({ success: true, bookmarked: false });
    } else {
      await pool.query(
        "INSERT INTO user_bookmarks (user_id, topic_id) VALUES ($1, $2)",
        [userId, id],
      );
      res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    console.error("Bookmark error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percentage } = req.body;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO user_topic_progress (user_id, topic_id, progress_percentage, last_read_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, topic_id)
       DO UPDATE SET progress_percentage = $3, last_read_at = CURRENT_TIMESTAMP`,
      [userId, id, progress_percentage],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  getCategories,
  getPopularTopics,
  bookmarkTopic,
  updateProgress,
};
