# MongoDB Atlas Vector Search Index Configuration

To enable semantic similarity retrieval for the RAG chat pipeline (Phase 1d), configure an **Atlas Vector Search Index** on the `chunks` collection in your MongoDB Atlas cluster.

---

## 1. Index Definition (JSON)

Save as reference from [vector-search-index.json](file:///c:/Users/ombiswas/Projects/AnchorAI/server/src/config/vector-search-index.json):

```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "userId"
      },
      {
        "type": "filter",
        "path": "documentId"
      }
    ]
  }
}
```

---

## 2. Steps to Apply via MongoDB Atlas Web UI

1. **Log in** to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Go to **Database** (Deployments) and select your cluster.
3. Click on the **Atlas Search** tab (or **Search** in the top navigation).
4. Click **Create Search Index**.
5. Under **Atlas Vector Search**, choose **JSON Editor** and click **Next**.
6. Select your database (e.g. `anchor_ai`) and collection (`chunks`).
7. Enter Index Name: `vector_index`.
8. In the JSON editor box, paste the definition above:
   - `numDimensions`: `1536` (matching OpenAI `text-embedding-3-small`).
   - `similarity`: `cosine` (cosine similarity for normalized embedding vectors).
   - `filter`: Both `userId` and `documentId` are enabled as pre-filters so vector queries can be securely scoped to the current user's document.
9. Click **Create Vector Search Index**.
10. The status will transition from `Building` to `Active` (typically takes 1-2 minutes).

---

## 3. Alternative: Apply via MongoDB Atlas CLI

```bash
atlas clusters search indexes create --clusterName <YourClusterName> --file src/config/vector-search-index.json
```
