# **Feature Spec: Automated Cron Jobs & Deferred Scoring UI**

Goal: Automate the game loop using Supabase Cron Jobs and improve UX with a "Daily Recap" animation.

## **1\. Architecture: Edge Functions & Cron**

We are moving heavy logic to Supabase Edge Functions to bypass Vercel serverless timeouts.

### **1.1. Weekly Snapshot Job**

* **Schedule:** Every Monday at 03:00 AM UTC.  
* **Function Name:** perform-weekly-snapshot  
* **Logic:**  
  1. Apply current logic


### **1.2. Daily Scoring Job**

* **Schedule:** Every Day at 02:00 AM UTC.  
* **Function Name:** calculate-daily-scores  
* **Logic:**  
  1. Apply current logic  
  2. **Crucial Step (Deferred UI):**  
     * Do NOT just update profiles.total\_score silently.  
     * Insert a record into a new table daily\_score\_logs (see Schema).  
     * Update profiles.total\_score.  
  3. This allows the Frontend to show "You gained \+X points since yesterday" based on the log.

## **2\. Database Schema Updates**

### **A. Enable Extension**

Ensure pg\_cron is enabled in Supabase.

### **B. New Table: daily\_score\_logs**

This table acts as a "buffer" to show the user what happened while they were away.

* id: uuid (PK)  
* user\_id: uuid (FK \-\> profiles)  
* date: date (The date of the scoring run)  
* points\_gained: integer (The delta for that day)  
* breakdown: jsonb (Optional: \[{ artist: "Lazza", pts: 5 }, { artist: "Anna", pts: 2 }\])  
* seen\_by\_user: boolean (Default: false)  
* created\_at: timestamp

### **C. Indexes**

* Add index on daily\_score\_logs(user\_id, seen\_by\_user) for fast frontend fetching.  
* Add index on weekly\_snapshots for fast scoring comparisons.

## **3\. Implementation Details (Edge Functions)**

Performance Requirement:  
When writing the Edge Functions, use Supabase-js RPC calls or direct SQL queries for batch updates.

* *Bad:* Loop 1000 users \-\> 1000 Updates.  
* *Good:* Create an array of all updates \-\> Perform one upsert call.

## **4\. Frontend UI Components**

### **4.1. The "Next Scoring" Countdown**

Location: Main Dashboard Card.  
Logic:

* Target: The next occurrence of 02:00 UTC.  
* Display: "Punti in arrivo tra: HH:MM:SS".  
* *Note:* If the current time is between 02:00 and 02:15 (Scoring in progress), show "Calcolo in corso...".

### **4.2. The "Daily Recap" Modal (Deferred Scoring)**

When the user logs in or refreshes the dashboard:

1. **Query:** SELECT \* FROM daily\_score\_logs WHERE user\_id \= me AND seen\_by\_user \= false.  
2. **Trigger:** If a record exists:  
   * Show a Full Screen / Modal overlay.  
   * **Animation:** Counter rolling up from 0 to points\_gained.  
   * **Text:** "I tuoi artisti hanno guadagnato punti\!"  
   * **Button:** "Riscatta Punti" (Claim Points).  
3. **Action:** Clicking the button triggers an API call to set seen\_by\_user \= true.  
4. **Effect:** Only AFTER clicking, animate the Total Score in the navbar updating to the new value.

## **5\. Summary of Tasks for AI**

1. Create daily\_score\_logs table.  
2. Create perform-weekly-snapshot Edge Function (porting logic from existing takeSnapshot).  
3. Create calculate-daily-scores Edge Function (porting logic from existing scoring).  
4. Write the SQL to schedule these with pg\_cron.  
5. Create the CountdownTimer component for the Dashboard.  
6. Create the DailyRecapModal component to handle the "seen" logic and animation.