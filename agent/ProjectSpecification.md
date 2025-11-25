# **AI Agent Master Specification: FantaMusiké MVP**

## **1\. Project Context**

Product Name: FantaMusiké  
Type: Music Strategy Game (Fantasy Sports for Music)  
Target Market: Italy  
Core Concept: Users ("Managers") draft a team of 5 artists. They earn points based on the artists' real-world growth (Spotify Popularity & Followers) and new releases.  
Design Aesthetic: "Dark Mode Glassmorphism" (Deep backgrounds \#0b0b10, vibrant purple/pink/blue gradients, backdrop-blur).

## **2\. Technology Stack (Strict)**

* **Framework:** Next.js 14+ (App Router)  
* **Language:** TypeScript  
* **Styling:** Tailwind CSS \+ lucide-react for icons.  
* **Backend/Database:** Supabase (PostgreSQL \+ Auth).  
* **Data Source:** Spotify Web API (Official).  
* **State Management:** React Hooks (Simple state) or Zustand (if complex).  
* **Hosting:** Vercel (implied).

## **3\. Database Schema (Supabase)**

**Instructions for AI:** Create the following tables in Supabase.

### **3.1. profiles (Public Users)**

* id: uuid (References auth.users)  
* username: text (unique)  
* avatar\_url: text  
* total\_score: integer (Default: 0\)  
* musi\_coins: integer (Default: 50\)  
* is\_admin: boolean (Default: false)  
* created\_at: timestamp

### **3.2. artists\_cache (To avoid Rate Limits)**

* spotify\_id: text (Primary Key)  
* name: text  
* image\_url: text  
* current\_popularity: integer (0-100)  
* current\_followers: integer  
* last\_updated: timestamp (Check this before fetching API)

### **3.3. teams (The User's Roster)**

* user\_id: uuid (References profiles.id, Unique \- 1 team per user)  
* slot\_1\_id: text (Ref artists\_cache.spotify\_id) \- **Headliner**  
* slot\_2\_id: text (Ref artists\_cache.spotify\_id) \- **Mid Tier**  
* slot\_3\_id: text (Ref artists\_cache.spotify\_id) \- **Mid Tier**  
* slot\_4\_id: text (Ref artists\_cache.spotify\_id) \- **New Gen**  
* slot\_5\_id: text (Ref artists\_cache.spotify\_id) \- **New Gen**  
* captain\_id: text (Must be one of the slots)  
* locked\_at: timestamp (When the team was last edited)

### **3.4. weekly\_scores (Historical Data)**

* id: uuid  
* week\_number: integer  
* artist\_id: text  
* popularity\_gain: integer  
* follower\_gain\_percent: float  
* release\_bonus: integer  
* total\_points: integer

## **4\. Game Logic & Rules (The "Brain")**

### **4.1. Drafting Constraints (Validation)**

When a user searches and tries to add an artist to a slot, enforce these checks using Spotify's popularity field:

* **Slot 1 (Headliner):** Popularity \> 75  
* **Slots 2 & 3 (Mid Tier):** Popularity between 30 and 75  
* **Slots 4 & 5 (New Gen):** **CRITICAL:** Popularity MUST be \< 30\.  
  * *Error Message:* "Questo artista è troppo famoso per la categoria New Gen\! Cerca qualcuno con popolarità inferiore a 30."

### **4.2. Scoring System (Weekly Calculation)**

* **Hype Score:** (Current\_Pop \- Start\_Week\_Pop) \* 10  
* **Fanbase Score:** ((Current\_Followers \- Start\_Followers) / Start\_Followers) \* 100  
* **Release Bonus:** \+20 pts (Single), \+50 pts (Album) \- *Check Spotify API getArtistAlbums release\_date \> week\_start*.  
* **Captain Multiplier:** Total Score x 1.5

## **5\. UI/UX Specifications**

**Design System:**

* **Background:** \#0b0b10 (Deep void)  
* **Card Surface:** bg-white/5 with backdrop-blur-md and border-white/10.  
* **Primary Gradient:** bg-gradient-to-br from-purple-600 to-blue-500.  
* **Font:** Sans-serif (Inter or similar).

**Key Views:**

1. **Landing Page:**  
   * Hero text: "Il Fantacalcio della Musica".  
   * Login Button: "Entra con Spotify" (Supabase OAuth).  
   * Visuals: Floating glass cards showing artist stats.  
2. **Dashboard (Home):**  
   * Top: Total Score (Large typography) & Global Rank.  
   * Center: "My Label" (List of 5 artist cards).  
   * Cards: Must show Artist Image, Name, Category (e.g., "New Gen"), and current Trend (+pts).  
3. **Drafting (Scout):**  
   * Search bar connected to Spotify API.  
   * Filter Pills: "Tutti", "New Gen (\<30)", "Mid Tier".  
   * Result Cards: Show visual indicator if valid/invalid for selected slot.

## **6\. Implementation Steps for AI Agent**

**Step 1: Setup & Auth**

* Initialize Next.js project with Tailwind.  
* Install Supabase client.  
* Configure Supabase Auth to use **Spotify OAuth Provider** (Scopes: user-top-read, user-read-email).

**Step 2: Spotify Integration Service**

* Create a lib/spotify.ts service.  
* Implement searchArtist(query) \-\> Returns simplified object { id, name, image, popularity, followers }.  
* Implement getArtistStats(id) \-\> Returns detailed stats.

**Step 3: Drafting Logic (Frontend)**

* Build the TeamSelector component.  
* Implement state to hold 5 slots.  
* Add validation logic: Prevent adding "Sfera Ebbasta" (Pop 85\) to "New Gen" slot.

**Step 4: Backend Jobs (Edge Functions)**

* Create a Supabase Edge Function update-scores.  
* Logic: Fetch all artists\_cache \-\> Query Spotify API for fresh data \-\> Calculate Delta \-\> Update weekly\_scores.

**Step 5: UI Polish**

* Apply the "Glassmorphism" classes defined in Section 5\.  
* Ensure Mobile Responsiveness (Hamburger menu on mobile, Sidebar on Desktop).

## **7\. API Routes (Next.js) references**

* GET /api/spotify/search?q=...  
* POST /api/team/save (Body: { slots: \[...\] })  
* GET /api/leaderboard

**End of Spec.**