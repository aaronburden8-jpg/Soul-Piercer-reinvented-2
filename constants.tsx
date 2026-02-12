
import React from 'react';
import { Profile } from './types';

export const PROFILES: Record<string, Profile> = {
  "sarah": {
    name: "Sarah",
    role: "Wife",
    tone: "Gentle, loving, emotionally safe. Goal: Peace, unity, reassurance.",
    signature: "Love, Aaron",
    scriptures: ["Ephesians 4:2-3", "1 Corinthians 13:4-7", "Colossians 3:12-14", "Philippians 4:6-7", "Psalm 23", "Psalm 46:10", "Song of Songs 2:10"],
    themes: ["Marriage Unity", "Peace & Anxiety Relief", "Identity & Worth", "Forgiveness & Fresh Starts", "Rest & Grace", "Fun & Laughter"],
    structure: "Standard",
    special_instructions: "Focus on connection and safety."
  },
  "jessica leigh": {
    name: "Jessica Leigh",
    role: "My Love",
    tone: "Romantic, intimate, passionate, storytelling. Focus on a shared experience or date.",
    signature: "Love, Aaron",
    themes: ["A Quiet Cabin", "A City Night", "Stargazing", "A Long Drive", "A Fancy Dinner", "A Walk on the Beach", "A Surprise Getaway"],
    structure: "DATE_STORY",
    special_instructions: "Write a long, immersive, romantic story (aim for 2000 words) about a date between Aaron and Jessica Leigh. Focus on sensory details, conversation, and connection. Do NOT write a devotional. Do NOT include scriptures or prayers."
  },
  "adrienne": {
    name: "Adrienne",
    role: "Close Friend",
    tone: "Deeply caring, spiritually respectful. Bridges biblical wisdom with universal themes of Light, Truth, and Service. Non-argumentative.",
    signature: "Love, Aaron",
    scriptures: ["James 1:17", "Proverbs 4:18", "John 1:5", "Micah 6:8", "Psalm 36:9"],
    themes: ["The Path of Wisdom", "Inner Light & Truth", "Service to Humanity", "Peace in Transition", "Discernment", "Universal Love"],
    structure: "Standard",
    special_instructions: "Use universal spiritual language (The Path, The Light, Source). Avoid dogmatic/exclusivist phrasing."
  },
  "caleb": {
    name: "Caleb",
    role: "Son",
    tone: "Direct, motivating, fatherly. Themes: Courage, wise choices.",
    signature: "Love, Dad",
    scriptures: ["Joshua 1:9", "1 Timothy 4:12", "Romans 12:2", "Psalm 119:9", "Proverbs 20:7"],
    themes: ["Courage & Conviction", "Wise Choices", "Identity & Purpose", "Influence & Character", "Standing Firm", "Building Strength"],
    structure: "Standard",
    special_instructions: "Be motivating and clear. Speak man-to-man but with fatherly warmth."
  },
  "felicity": {
    name: "Felicity",
    role: "Daughter",
    tone: "Gentle, vivid, emotionally safe. Themes: God is with me, I am loved.",
    signature: "Love, Dad",
    scriptures: ["Psalm 139:14", "Zephaniah 3:17", "Psalm 23", "Matthew 6:26", "1 John 3:1"],
    themes: ["God is With Me", "I am Loved", "Courage for Today", "Peace & Safety", "Joy & Wonder"],
    structure: "Standard",
    special_instructions: "Use vivid, gentle imagery. Remind her she is safe and loved."
  },
  "amberlynn": {
    name: "Amberlynn",
    role: "Oldest Daughter",
    tone: "Highly encouraging, affirming, safety-building. Focus on her worth, strength, and God's specific plan for her.",
    signature: "Love, Dad",
    scriptures: ["Jeremiah 29:11", "Proverbs 31:25", "Psalm 46:5", "Philippians 1:6", "Zephaniah 3:17"],
    themes: ["You are Capable", "God's Beautiful Plan", "Strength & Dignity", "Unshakeable Worth", "Joy in the Journey"],
    structure: "Standard",
    special_instructions: "Be the biggest cheerleader. Focus on encouragement and belief in her future."
  },
  "jonah": {
    name: "Jonah",
    role: "Adult Son",
    tone: "Calm, resilient, practical. Themes: Stress, wisdom, endurance.",
    signature: "Love, Dad",
    scriptures: ["Philippians 4:6-7", "Matthew 11:28-30", "James 1:5", "Psalm 46:1", "Proverbs 3:5-6"],
    themes: ["Stress & Peace", "Wisdom & Priorities", "Endurance", "Confidence in God", "Navigating Change"],
    structure: "Standard",
    special_instructions: "Be practical and steady."
  },
  "adam": {
    name: "Adam",
    role: "Adult Son",
    tone: "Motivating, disciplined, encouraging. Themes: Consistency, purpose.",
    signature: "Love, Dad",
    scriptures: ["2 Timothy 1:7", "Proverbs 4:23", "Colossians 3:23", "Romans 12:2", "1 Corinthians 15:58"],
    themes: ["Consistency & Habits", "Purpose & Direction", "Confidence", "Integrity", "Excellence in Work"],
    structure: "Standard",
    special_instructions: "Focus on discipline and integrity."
  },
  "luke": {
    name: "Luke",
    role: "Son",
    tone: "Strong, encouraging, focused. Themes: Growth, strength.",
    signature: "Love, Dad",
    scriptures: ["1 Corinthians 16:13", "Isaiah 40:31", "Proverbs 27:17", "Ephesians 6:10"],
    themes: ["Strength & Honor", "Friendship & Loyalty", "Growing in Faith", "Overcoming Obstacles"],
    structure: "Standard",
    special_instructions: "Encourage strength and honor."
  },
  "don thomas": {
    name: "Don Thomas",
    role: "Close Friend",
    tone: "Brotherly, wise, steady. Focus on stewardship, financial preparation, and trusting God's timing.",
    signature: "Your friend, Aaron",
    scriptures: ["Proverbs 21:5", "Matthew 6:33", "Philippians 4:19", "Psalm 37:3-5", "Proverbs 16:3", "Psalm 16:6", "Ecclesiastes 5:19"],
    themes: ["Stewardship & Planning", "Trusting God's Provision", "Joy in Today's Work", "Faithfulness in the Present", "Legacy Building", "Walking in Wisdom", "Peace for the Future"],
    structure: "Standard",
    special_instructions: "Be a steady brother. Encourage joy in the present moment while planning for the future."
  },
  "dan burden": {
    name: "Dan Burden",
    role: "Dad",
    tone: "Reflective, steady, filled with wisdom. Focus on God's faithfulness over the long haul.",
    signature: "Love, Aaron",
    scriptures: ["Psalm 91", "Hebrews 12:1-2", "Isaiah 40:28-31", "Lamentations 3:22-23", "Romans 8:38-39"],
    themes: ["Faithfulness over a Lifetime", "Trusting God's Plan", "Peace in the Storm", "The Goodness of God", "Legacy of Faith"],
    structure: "Standard",
    special_instructions: "Address him as 'Dad'. Focus on wisdom and encouragement, not academic study."
  },
  "deb burden": {
    name: "Deb Burden",
    role: "Mom",
    tone: "Comforting, resilient, filled with hope. Acknowledges pain but points to God's sustaining grace.",
    signature: "Love, Aaron",
    scriptures: ["2 Corinthians 12:9", "Psalm 73:26", "Psalm 34:18", "Romans 8:18", "Isaiah 41:10"],
    themes: ["Sustaining Grace", "God's Presence in Pain", "Eternal Hope", "Strength in Weakness", "The Joy of the Lord"],
    structure: "Standard",
    special_instructions: "Be very gentle. Acknowledge pain but focus on God's sustaining strength."
  },
  "jackie": {
    name: "Jackie",
    role: "Friend in Michigan (Catholic Prayer Partner)",
    tone: "PURE CATHOLIC, Reverent, Sacramental. Include Saint intercession.",
    signature: "Your friend, Aaron",
    scriptures: ["Luke 1", "Philippians 4:6-7", "John 14:27", "Psalm 27", "Romans 8:26"],
    themes: ["Trust & Peace", "Prayer & Intercession", "Hope & Healing", "Divine Mercy", "The Communion of Saints", "The Eucharist"],
    structure: "Standard",
    special_instructions: "Use distinctly Catholic terminology. Closing prayer MUST ask a Saint for intercession."
  },
  "veronica": {
    name: "Veronica",
    role: "Friend (Insurance Agent)",
    tone: "Warm, encouraging, faith-filled. **OUTPUT MUST BE IN SPANISH** (headers English).",
    signature: "Con cariño, Aaron",
    scriptures: ["Filipenses 4:19", "Mateo 6:26", "Salmo 23:1", "Isaías 41:10", "Salmo 34:10"],
    themes: ["Provisión Divina", "Confianza en la Escasez", "Paz en la Tormenta", "Valor y Fe", "Esperanza Futura"],
    structure: "Standard",
    special_instructions: "Write content in Spanish."
  },
  "greg": {
    name: "Greg",
    role: "Work Friend / Financial Mentor",
    tone: "Catholic, encouraging, respectful. Acknowledges our work dynamic but appreciates his financial wisdom.",
    signature: "Your friend, Aaron",
    scriptures: ["Colossians 3:23", "Matthew 25:21", "Luke 16:10", "Proverbs 27:17", "1 Peter 4:10"],
    themes: ["Stewardship & Finance", "Work as Worship", "Faithful Planning", "St. Joseph's Example", "Generosity", "Mutual Sharpening"],
    structure: "Standard",
    special_instructions: "Use Catholic terminology. Closing prayer MUST ask a Saint for intercession."
  }
};

interface IconProps {
  className?: string;
}

export const Icons = {
  // Added className prop to all icon components to resolve TS errors in App.tsx and DevotionalDisplay.tsx
  Crosshair: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>,
  Send: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Loader: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className || ''}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  History: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>,
  Book: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Dive: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>,
  Anchor: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>,
  Play: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Heart: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Target: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Series: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 10h6"/><path d="M9 14h6"/></svg>,
  ChevronRight: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>,
  Volume2: ({ className }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
};
