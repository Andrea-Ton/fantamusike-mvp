# **FantaMusiké \- Season Zero: MVP Specification**

Version: 1.1 (MVP \- API Pivot)  
Target Market: Italy  
Core Value: "The Fantacalcio of Music Industry"

## **1\. Product Concept**

FantaMusiké is a strategy game where users act as "Record Label Managers." Users win by predicting which artists will spike in popularity and release successful music.

**Goal:** Validate that users are interested in tracking artist data and discovering new talent.

## **2\. Game Rules (The Logic)**

### **2.1. Team Composition (The "Label")**

Since we cannot use Monthly Listeners for free, we will use the **Spotify Popularity Index (0-100)**. This is a public metric found in the Spotify API that measures how "hot" an artist is right now.

Each user must fill these specific slots based on the artist's **Current Popularity Score**:

| Slot Type | Quantity | Requirement (Spotify Popularity 0-100) | Example (Approx.) |
| :---- | :---- | :---- | :---- |
| **Big / Headliner** | 1 | **\> 75** | Lazza, Sfera, Taylor Swift |
| **Mid-Tier** | 2 | **30 \- 75** | Indie artists, rising trappers |
| **New Gen (Emerging)** | 2 | **\< 30** | **True Underground (The Scout Bet)** |

**Why this works:** The Popularity Index is standard across all artists. Asking users to find an artist with \< 30 popularity gamifies the "digging" process.

### **2.2. The Scoring Algorithm (Weekly Calculation)**

Scores are calculated once per week (e.g., Friday 00:00 CET).

**Total Score \= (Popularity Jump) \+ (Follower Growth) \+ (Activity Bonuses)**

#### **A. The "Hype" Score (Popularity Delta)**

We track the change in the 0-100 Index.

* **Formula:** (Current\_Popularity \- Start\_Week\_Popularity) \* 10  
* *Example:* An artist jumps from Popularity **20** to **25** (+5).  
  * Score: 5 \* 10 \= **50 Points**.

#### **B. The "Fanbase" Score (Follower Growth)**

Since followers is a real number provided by the API, we track the % growth.

* **Formula:** ((Current\_Followers \- Start\_Followers) / Start\_Followers) \* 100  
* *Example:* An emerging artist goes from 1,000 to 1,100 followers (+10%).  
  * Score: **10 Points**.

#### **C. Activity Bonuses (The "Events")**

Data fetched via Spotify API (Albums Endpoint) or Playlist API.

* **New Release:** \+20 Points (Single), \+50 Points (Album).  
* **The "Top 50" Bonus:** Check if artist is in the official "Top 50 \- Italy" Playlist (ID: 37i9dQZEVXbJUPkga5cCYg).  
  * If present: **\+10 Points**.  
  * If \#1 position: **\+50 Points**.

#### **D. The Multipliers**

* **Captain:** User selects 1 Artist as Captain \-\> **Score x 1.5**.  
* **Partner Bonus:** If the user selects an artist from the "Musiké Partner List" \-\> **Fixed \+20 Points**.

## **3\. User Flows**

### **3.1. Onboarding (The "Fan" View)**

1. **Landing Page:** Value Prop: "Dimostra di essere il miglior Talent Scout d'Italia."  
2. **Auth:** "Login with Spotify" (Mandatory).  
3. **Tutorial:** Explain the "Popularity Score" concept briefly.

### **3.2. The Draft (Core Action)**

1. **Search Interface:** User searches for an artist.  
2. **Validation (API Check):**  
   * System fetches artist.popularity.  
   * If User puts a Popularity 80 artist in "New Gen" (\<30):  
   * *Error:* "Too famous\! You need an artist with Popularity under 30."  
3. **Confirm Team:** Save to Supabase.

### **3.3. The Dashboard (Retention)**

1. **Live Score:** "Your Team's Performance."  
2. **Leaderboard:** Global ranking.  
3. **Share Card:** "My Label for Season Zero."

## **4\. Artist Flows (Manual MVP)**

* **Recruitment:** DM artists.  
* **The Offer:** "We drive real Spotify Follower growth because users need to track you."  
* **Implementation:** Add Spotify ID to partner\_artists table.

## **5\. Monetization & Economy (The "Pragmatic" Approach)**

* **Virtual Currency ("MusiCoins"):**  
  * **Allowance:** 50 Free Coins.  
  * **Transfer Market:** 10 Coins to swap an artist mid-week.  
  * **Earn Coins:** Invite a friend (+20 Coins).

## **6\. Technical Requirements (For Developer)**

* **Frontend:** Next.js (PWA).  
* **Backend:** Supabase.  
* **Integration:**  
  * Spotify Web API: GET /artists/{id} (for Popularity/Followers).  
  * Spotify Web API: GET /artists/{id}/albums (for New Releases).  
  * Spotify Web API: GET /playlists/37i9dQZEVXbJUPkga5cCYg (for Top 50 Italy check).  
* **Jobs:** Scheduled CRON (Friday) to update scores.

## **7\. Prizes**

* **1st Place:** TicketOne Gift Card (€50).  
* **2nd-5th Place:** Early Access Status.  
* **Weekly Winner:** Social Media Shoutout.