
# stylcop — AI Fashion Architecture

## 1. App Architecture Diagram
```text
[ Mobile App (Expo) ] <--- REST/WS ---> [ API Gateway (Express) ]
                                          |
        +---------------------------------+----------------------------------+
        |                                 |                                  |
[ Wardrobe Engine ]             [ Social Battle Engine ]          [ Shop Intel Engine ]
  - Background Removal            - Real-time Voting (WS)           - Scraping Service
  - Feature Extraction (Gemini)   - Matchmaking Logic               - Price Comparator
  - Embeddings (Vector DB)        - Leaderboard (Redis)             - Affiliate Tracking
        |
[ Database Layer ]
  - User Stats (MongoDB)
  - Asset Blobs (S3/Cloudinary)
  - Vector Embeddings (Pinecone)
```

## 2. Database Schema (MongoDB)
- **User**: `id, username, college, points, styleEmbeddings, streak_meta`
- **ClothingItem**: `id, userId, imgUrl, cat, style, palette, lastWorn, purchaseUrl`
- **Battle**: `id, challengerId, defenderId, voteCounts, expiresAt, status`
- **Recommendations**: `id, userId, itemIds, context (weather/occasion), interaction (like/skip)`

## 3. AI Model Pipeline
1.  **Ingestion**: Image captured -> Resize/Normalize.
2.  **Segementation**: Gemini-3 Flash identifies clothing boundary -> Masking -> BG Removal.
3.  **Classification**: Multi-label classification (Top/Bottom, Cotton/Wool, Street/Preppy).
4.  **Vectorization**: Generate 1536d embeddings for similarity search (used in Shop Intelligence).
5.  **OOTD Gen**: Contextual prompt sent to Gemini-3 Pro including user wardrobe JSON + current weather + schedule.

## 4. Recommendation Algorithm
- **Weighting**: `Style_Match (40%) + Color_Harmony (20%) + Context_Fit (20%) + Recency_Penalty (20%)`.
- **Harmony**: Uses Complementary/Triadic color math via extracted palettes.
- **Feedback Loop**: Liked fits increase Style_Match weights for those specific categories.

## 5. Deployment Steps
- **Frontend**: `expo publish` for OTA updates; Build via EAS for App Store/Play Store.
- **Backend**: Containerize Node.js/Python services with Docker -> Deploy to AWS EKS.
- **Caching**: Redis for real-time battle leaderboards.
- **CI/CD**: GitHub Actions for automated testing and deployment to staging/prod.

## 6. Future Scalability
- **AR Try-on**: Integrate VTON (Virtual Try-On) models to preview outfits on user avatars.
- **DAO Integration**: Let users vote on upcoming "Stylcop Limited Edition" drops.
- **Campus Hubs**: Dedicated chat rooms and local trade marketplaces for college campuses.
